import { useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { isTelegramEnvironment, initTelegram, getTelegramInitData } from '../../lib/telegram'
import { useSession } from '../../hooks/useSession'
import { WebAuthPage } from '../../pages/marketplace/WebAuthPage'
import { Spinner } from '../shared/Spinner'

/**
 * Внутри Telegram личность даёт сам мессенджер — подписанные initData проверяются
 * на сервере (server/src/auth/telegram.js) и меняются на наш токен. В обычном вебе
 * такого нет, поэтому там требуем полноценный вход по email.
 */
export function AuthGate() {
  const session = useSession()
  const queryClient = useQueryClient()
  // ref, а не state: флаг нужен только чтобы не запустить вход дважды, на рендер он не влияет
  const signingIn = useRef(false)
  // запоминаем, чей это был профиль, чтобы при смене пользователя (выход/вход под другим
  // аккаунтом) сбросить кэш — иначе useMyProfile (staleTime: Infinity) продолжит отдавать
  // данные предыдущего аккаунта, и весь интерфейс будет работать от чужого имени
  const lastUserId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (session === undefined) return
    const userId = session?.id ?? null
    if (lastUserId.current !== undefined && lastUserId.current !== userId) {
      queryClient.clear()
    }
    lastUserId.current = userId
  }, [session, queryClient])

  useEffect(() => {
    if (session !== null || !isTelegramEnvironment || signingIn.current) return
    signingIn.current = true
    ;(async () => {
      await initTelegram()
      try {
        await api.auth.telegram(getTelegramInitData())
      } catch {
        // остаёмся на экране входа — пользователь увидит WebAuthPage и сможет войти сам
      } finally {
        signingIn.current = false
      }
    })()
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
