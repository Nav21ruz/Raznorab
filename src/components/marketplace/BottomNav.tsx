import { NavLink } from 'react-router-dom'
import { Hammer, ClipboardList, MessageCircle, User, Wrench, Inbox } from 'lucide-react'
import type { NotificationsSummary, Role } from '../../types/marketplace'

interface NavItem { to: string; icon: typeof Hammer; label: string; countKey?: keyof NotificationsSummary }

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  customer: [
    { to: '/orders', icon: ClipboardList, label: 'Заказы', countKey: 'pendingCandidates' },
    { to: '/labor/mine', icon: Wrench, label: 'Разнорабочие', countKey: 'newLaborResponses' },
    { to: '/chats', icon: MessageCircle, label: 'Чаты', countKey: 'unreadMessages' },
    { to: '/profile', icon: User, label: 'Профиль' },
  ],
  builder: [
    { to: '/feed', icon: Hammer, label: 'Лента' },
    { to: '/responses', icon: Inbox, label: 'Отклики' },
    { to: '/chats', icon: MessageCircle, label: 'Чаты', countKey: 'unreadMessages' },
    { to: '/profile', icon: User, label: 'Профиль' },
  ],
  laborer: [
    { to: '/labor', icon: Wrench, label: 'Задачи' },
    { to: '/labor/my-responses', icon: Inbox, label: 'Отклики' },
    { to: '/chats', icon: MessageCircle, label: 'Чаты', countKey: 'unreadMessages' },
    { to: '/profile', icon: User, label: 'Профиль' },
  ],
}

export function BottomNav({ role, counts }: { role: Role; counts?: NotificationsSummary }) {
  const items = NAV_BY_ROLE[role]
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-gray-950/95 backdrop-blur-md border-t border-gray-800/60" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-lg mx-auto grid grid-cols-4">
        {items.map(({ to, icon: Icon, label, countKey }) => {
          const count = countKey && counts ? counts[countKey] : 0
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `relative flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${isActive ? 'text-copper-400' : 'text-gray-500'}`}
            >
              <span className="relative">
                <Icon className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-copper-500 text-white text-[10px] font-semibold leading-none flex items-center justify-center">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </span>
              {label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
