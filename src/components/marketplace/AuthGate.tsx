import { useEffect, useRef } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from '../../hooks/useSession'
import { LandingPage } from '../../pages/marketplace/LandingPage'
import { Spinner } from '../shared/Spinner'

export function AuthGate() {
  const session = useSession()
  const location = useLocation()
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
  if (session === null) {
    // "/" — публичная страница-визитка для тех, кто ещё не заходил на сайт;
    // любой другой защищённый адрес (прямая ссылка на /orders и т.п.) ведёт сразу
    // на форму входа — не показывать же рекламный текст в ответ на закладку в браузере.
    if (location.pathname === '/') return <LandingPage />
    return <Navigate to="/auth" replace />
  }
  return <Outlet />
}
