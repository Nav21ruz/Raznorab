import { useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { isTelegramEnvironment } from '../../lib/telegram'
import { useSession } from '../../hooks/useSession'
import { WebAuthPage } from '../../pages/marketplace/WebAuthPage'
import { Spinner } from '../shared/Spinner'

/**
 * Внутри Telegram личность даёт сам мессенджер — входим анонимно и связываем профиль
 * с telegram_id. В обычном вебе такого нет: анонимная сессия живёт только в этом
 * браузере, поэтому там требуем полноценный вход, иначе аккаунт теряется навсегда
 * при очистке данных браузера или смене устройства.
 */
export function AuthGate() {
  const session = useSession()
  const queryClient = useQueryClient()
  // ref, а не state: флаг нужен только чтобы не запустить вход дважды, на рендер он не влияет
  const signingIn = useRef(false)
  // запоминаем, чей это был профиль, чтобы при смене пользователя (выход/вход под другим
  // аккаунтом) сбросить кэш — иначе useMyProfile (staleTime: Infinity) продолжит отдавать
  // данные предыдущего аккаунта, и весь интерфейс будет работать от чужого имени.
  // Слушаем событие напрямую (а не реагируем на смену session после рендера), чтобы кэш
  // очистился до того, как компоненты успеют прочитать из него чужие данные.
  const lastUserId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      const userId = next?.user.id ?? null
      if (lastUserId.current !== undefined && lastUserId.current !== userId) {
        queryClient.clear()
      }
      lastUserId.current = userId
    })
    return () => subscription.unsubscribe()
  }, [queryClient])

  useEffect(() => {
    if (session !== null || !isTelegramEnvironment || signingIn.current) return
    signingIn.current = true
    supabase.auth.signInAnonymously().finally(() => { signingIn.current = false })
  }, [session])

  if (session === undefined || (session === null && isTelegramEnvironment)) {
    return (
      <div className="min-h-dvh bg-gray-950 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (session === null) return <WebAuthPage />

  return <Outlet />
}
