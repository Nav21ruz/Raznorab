import { Link, useLocation } from 'react-router-dom'
import { HardHat, LayoutDashboard, BarChart2, LogOut, Bell } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useEffect } from 'react'
import { toast } from 'sonner'

export function Navbar() {
  const { pathname } = useLocation()

  useEffect(() => {
    const lastPrompt = localStorage.getItem('lastEntryPrompt')
    const today = new Date().toDateString()
    if (lastPrompt !== today) {
      const hour = new Date().getHours()
      if (hour >= 17) {
        toast('Не забудьте добавить запись за сегодня', {
          icon: <Bell className="w-4 h-4 text-orange-400" />,
          duration: 6000,
          action: {
            label: 'Понял',
            onClick: () => localStorage.setItem('lastEntryPrompt', today),
          },
        })
        localStorage.setItem('lastEntryPrompt', today)
      }
    }
  }, [])

  const nav = [
    { to: '/', icon: LayoutDashboard, label: 'Объекты' },
    { to: '/stats', icon: BarChart2, label: 'Статистика' },
  ]

  return (
    <header className="bg-gray-950/80 backdrop-blur-md border-b border-gray-800/60 sticky top-0 z-20">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <HardHat className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm hidden sm:block">Журнал объекта</span>
        </Link>

        <nav className="flex items-center gap-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all
                ${pathname === to ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900'}`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:block">{label}</span>
            </Link>
          ))}

          <button
            onClick={() => supabase.auth.signOut()}
            className="ml-1 p-2 hover:bg-gray-800 rounded-xl text-gray-500 hover:text-gray-300 transition-colors"
            title="Выйти"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </header>
  )
}
