import { Navigate, Outlet } from 'react-router-dom'
import { useMyProfile } from '../../hooks/useProfile'
import { BottomNav } from './BottomNav'
import { Spinner } from '../shared/Spinner'

export function MarketplaceShell({ nav = true }: { nav?: boolean }) {
  const { data: profile, isLoading, isError } = useMyProfile()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
        <p className="text-sm text-gray-500 text-center">Не удалось загрузить профиль. Проверьте подключение и обновите страницу.</p>
      </div>
    )
  }

  if (!profile.role) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className={`min-h-screen bg-gray-950 ${nav ? 'pb-24' : ''}`}>
      <Outlet context={{ profile }} />
      {nav && <BottomNav role={profile.role} />}
    </div>
  )
}
