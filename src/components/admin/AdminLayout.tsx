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
    <div className="min-h-screen bg-bg-page">
      <header className="sticky top-0 z-20">
        {/* Бренд-полоса всегда тёмно-синяя, независимо от темы Briggo — так решено в
            дизайн-хендоффе: админка держит акцент бренда, а не следует светлой/тёмной теме. */}
        <div className="bg-[#102a43]">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-copper-400" />
              <span className="font-bold text-white text-sm">Briggo Admin</span>
            </div>
            <NavLink to="/" className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white">
              <ArrowLeft className="w-3.5 h-3.5" /> В приложение
            </NavLink>
          </div>
        </div>
        <nav className="bg-bg-card/95 backdrop-blur-md border-b border-border-1 max-w-3xl mx-auto px-4 flex gap-1 overflow-x-auto py-2">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-copper-500 text-white' : 'text-text-muted hover:text-text-secondary'}`}
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
