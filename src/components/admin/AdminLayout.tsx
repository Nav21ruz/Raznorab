import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Flag, Users, ShieldAlert, ArrowLeft } from 'lucide-react'

const NAV = [
  { to: '/admin', icon: LayoutDashboard, label: 'Дашборд', end: true },
  { to: '/admin/reports', icon: Flag, label: 'Жалобы' },
  { to: '/admin/users', icon: Users, label: 'Пользователи' },
  { to: '/admin/words', icon: ShieldAlert, label: 'Стоп-слова' },
]

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950">
      <header className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/60">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-400" />
            <span className="font-bold text-white text-sm">Админ-панель</span>
          </div>
          <NavLink to="/" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300">
            <ArrowLeft className="w-3.5 h-3.5" /> В приложение
          </NavLink>
        </div>
        <nav className="max-w-3xl mx-auto px-4 flex gap-1 overflow-x-auto pb-2">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
