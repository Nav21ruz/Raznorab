import { Link } from 'react-router-dom'
import { Users, ClipboardList, Wrench, Flag, ShieldOff } from 'lucide-react'
import { useAdminCounts } from '../../hooks/useModeration'
import { Spinner } from '../../components/shared/Spinner'

export function AdminDashboardPage() {
  const { data: counts, isLoading } = useAdminCounts()

  if (isLoading || !counts) return <Spinner className="mt-16" />

  const cards = [
    { label: 'Пользователи', value: counts.profiles, icon: Users, to: '/admin/users' },
    { label: 'Заказы', value: counts.orders, icon: ClipboardList, to: '/admin/users' },
    { label: 'Задачи разнорабочих', value: counts.laborTasks, icon: Wrench, to: '/admin/users' },
    { label: 'Новые жалобы', value: counts.pendingReports, icon: Flag, to: '/admin/reports', highlight: counts.pendingReports > 0 },
    { label: 'Забанено', value: counts.bannedUsers, icon: ShieldOff, to: '/admin/users' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Дашборд</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map(({ label, value, icon: Icon, to, highlight }) => (
          <Link
            key={label}
            to={to}
            className={`p-4 rounded-2xl border flex flex-col gap-2 transition-colors ${highlight ? 'bg-copper-500/10 border-copper-500/30 hover:bg-copper-500/15' : 'bg-bg-card border-border-1 hover:border-border-2'}`}
          >
            <Icon className={`w-5 h-5 ${highlight ? 'text-copper-hover' : 'text-text-muted'}`} />
            <span className="text-2xl font-bold text-text-primary">{value}</span>
            <span className="text-xs text-text-muted">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
