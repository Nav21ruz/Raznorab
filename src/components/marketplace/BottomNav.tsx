import { NavLink } from 'react-router-dom'
import { Hammer, ClipboardList, MessageCircle, User, Wrench, Inbox } from 'lucide-react'
import type { Role } from '../../types/marketplace'

interface NavItem { to: string; icon: typeof Hammer; label: string }

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  customer: [
    { to: '/orders', icon: ClipboardList, label: 'Заказы' },
    { to: '/labor/mine', icon: Wrench, label: 'Разнорабочие' },
    { to: '/chats', icon: MessageCircle, label: 'Чаты' },
    { to: '/profile', icon: User, label: 'Профиль' },
  ],
  builder: [
    { to: '/feed', icon: Hammer, label: 'Лента' },
    { to: '/responses', icon: Inbox, label: 'Отклики' },
    { to: '/chats', icon: MessageCircle, label: 'Чаты' },
    { to: '/profile', icon: User, label: 'Профиль' },
  ],
  laborer: [
    { to: '/labor', icon: Wrench, label: 'Задачи' },
    { to: '/labor/my-responses', icon: Inbox, label: 'Отклики' },
    { to: '/chats', icon: MessageCircle, label: 'Чаты' },
    { to: '/profile', icon: User, label: 'Профиль' },
  ],
}

export function BottomNav({ role }: { role: Role }) {
  const items = NAV_BY_ROLE[role]
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-gray-950/95 backdrop-blur-md border-t border-gray-800/60" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-lg mx-auto grid grid-cols-4">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${isActive ? 'text-orange-400' : 'text-gray-500'}`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
