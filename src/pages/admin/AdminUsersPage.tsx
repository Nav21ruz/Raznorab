import { useState } from 'react'
import { toast } from 'sonner'
import { Search, User, ShieldOff, ShieldCheck } from 'lucide-react'
import { Spinner } from '../../components/shared/Spinner'
import { useSearchProfiles, useAllBannedUsers, useBanUser, useUnbanUser } from '../../hooks/useModeration'
import { ROLE_LABELS } from '../../types/marketplace'

export function AdminUsersPage() {
  const [query, setQuery] = useState('')
  const { data: profiles, isLoading } = useSearchProfiles(query)
  const { data: bannedUsers } = useAllBannedUsers()
  const banUser = useBanUser()
  const unbanUser = useUnbanUser()

  const bannedIds = new Set((bannedUsers ?? []).map((b) => b.profile_id))

  const handleToggleBan = (profileId: string, isBanned: boolean) => {
    if (isBanned) {
      unbanUser.mutate(profileId, {
        onSuccess: () => toast.success('Пользователь разбанен'),
        onError: () => toast.error('Не удалось разбанить'),
      })
    } else {
      const reason = window.prompt('Причина бана (необязательно):') ?? ''
      banUser.mutate(
        { profileId, reason },
        { onSuccess: () => toast.success('Пользователь забанен'), onError: () => toast.error('Не удалось забанить') },
      )
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-4">Пользователи</h1>

      <div className="relative mb-6">
        <Search className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по имени, городу, телефону, telegram..."
          className="w-full pl-9 pr-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-100 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 placeholder:text-gray-600"
        />
      </div>

      {isLoading && <Spinner className="mt-16" />}

      <div className="flex flex-col gap-2">
        {profiles?.map((p) => {
          const banned = bannedIds.has(p.id)
          return (
            <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-gray-600" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white text-sm truncate">{p.first_name} {p.last_name ?? ''}</p>
                <p className="text-xs text-gray-500 truncate">
                  {p.role ? ROLE_LABELS[p.role] : 'без роли'}{p.city ? ` · ${p.city}` : ''}{p.telegram_username ? ` · @${p.telegram_username}` : ''}
                </p>
              </div>
              <button
                onClick={() => handleToggleBan(p.id, banned)}
                disabled={banUser.isPending || unbanUser.isPending}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${banned ? 'bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400' : 'bg-red-600/15 hover:bg-red-600/25 text-red-400'}`}
              >
                {banned ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                {banned ? 'Разбанить' : 'Забанить'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
