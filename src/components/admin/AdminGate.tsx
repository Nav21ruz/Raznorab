import { Navigate, Outlet } from 'react-router-dom'
import { useMyProfile } from '../../hooks/useProfile'
import { useIsAdmin } from '../../hooks/useModeration'
import { Spinner } from '../shared/Spinner'
import { AdminLayout } from './AdminLayout'
import type { Profile } from '../../types/marketplace'

export function AdminGate() {
  const { data: profile, isLoading: profileLoading } = useMyProfile()
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin(profile?.id)

  if (profileLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  // Не показываем никакого "доступ запрещён" — для не-админа страница просто не существует
  if (!profile || !isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <AdminLayout>
      <Outlet context={{ profile: profile as Profile }} />
    </AdminLayout>
  )
}
