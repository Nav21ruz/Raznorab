import { useOutletContext, useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { MessageCircle, User } from 'lucide-react'
import { Spinner } from '../../components/shared/Spinner'
import { useMyConversations } from '../../hooks/useConversations'
import type { Profile } from '../../types/marketplace'

export function ChatsListPage() {
  const { profile } = useOutletContext<{ profile: Profile }>()
  const navigate = useNavigate()
  const { data: conversations, isLoading } = useMyConversations(profile.id)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Чаты</h1>
        <p className="text-sm text-gray-500 mt-1">{conversations?.length ? `${conversations.length} мэтч(ей)` : 'Здесь появятся ваши мэтчи'}</p>
      </div>

      {isLoading && <Spinner className="mt-16" />}

      {!isLoading && conversations?.length === 0 && (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-gray-700" />
          </div>
          <p className="text-gray-400 font-medium">Пока нет чатов</p>
          <p className="text-sm text-gray-600 mt-1">Мэтчи с заказчиками и строителями появятся здесь</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {conversations?.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/chats/${c.id}`)}
            className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 active:scale-[0.99] transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
              {c.peerPhoto ? <img src={c.peerPhoto} alt="" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-gray-600" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={`truncate ${c.unreadCount > 0 ? 'font-bold text-white' : 'font-semibold text-white'}`}>{c.peerName}</p>
                {c.lastMessageAt && (
                  <span className="text-xs text-gray-600 shrink-0">
                    {formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: true, locale: ru })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">{c.contextTitle}</p>
                  {c.lastMessage && <p className={`text-sm truncate mt-0.5 ${c.unreadCount > 0 ? 'text-gray-200' : 'text-gray-400'}`}>{c.lastMessage}</p>}
                </div>
                {c.unreadCount > 0 && (
                  <span className="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-copper-500 text-white text-xs font-semibold flex items-center justify-center">
                    {c.unreadCount > 9 ? '9+' : c.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
