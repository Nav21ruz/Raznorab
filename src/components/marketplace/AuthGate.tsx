import { useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from '../../hooks/useSession'
import { WebAuthPage } from '../../pages/marketplace/WebAuthPage'
import { Spinner } from '../shared/Spinner'

export function AuthGate() {
  const session = useSession()
  const queryClient = useQueryClient()
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

  if (session === undefined) {
    return (
      <div className="min-h-dvh bg-gray-950 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }
  if (session === null) return <WebAuthPage />
  return <Outlet />
}
