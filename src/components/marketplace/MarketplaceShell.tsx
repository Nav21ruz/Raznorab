import { Navigate, Outlet } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { useMyProfile } from '../../hooks/useProfile'
import { useMyBanStatus } from '../../hooks/useModeration'
import { BottomNav } from './BottomNav'
import { Spinner } from '../shared/Spinner'

export function MarketplaceShell({ nav = true }: { nav?: boolean }) {
  const { data: profile, isLoading, isError } = useMyProfile()
  const { data: ban, isLoading: banLoading } = useMyBanStatus(profile?.id)

  if (isLoading || banLoading) {
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

  if (ban) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldOff className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-white font-semibold mb-1">Доступ ограничен</p>
          <p className="text-sm text-gray-500">Ваш аккаунт заблокирован администратором{ban.reason ? `: ${ban.reason}` : '.'}</p>
        </div>
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
