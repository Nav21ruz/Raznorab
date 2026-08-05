import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { Send, ArrowLeft, User } from 'lucide-react'
import { useConversation, useMessages, useSendMessage } from '../../hooks/useConversations'
import { useProfileById } from '../../hooks/useProfile'
import { useOrder } from '../../hooks/useOrders'
import { useLaborTask } from '../../hooks/useLabor'
import { Spinner } from '../../components/shared/Spinner'
import type { Profile } from '../../types/marketplace'

export function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useOutletContext<{ profile: Profile }>()
  const { data: conversation } = useConversation(id)
  const { data: messages, isLoading } = useMessages(id)
  const sendMessage = useSendMessage(id ?? '')
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const peerId = conversation ? (conversation.customer_id === profile.id ? conversation.worker_id : conversation.customer_id) : undefined
  const { data: peer } = useProfileById(peerId)
  const { data: order } = useOrder(conversation?.kind === 'order' ? conversation.order_id ?? undefined : undefined)
  const { data: laborTask } = useLaborTask(conversation?.kind === 'labor' ? conversation.labor_task_id ?? undefined : undefined)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.length])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    setText('')
    sendMessage.mutate(trimmed)
  }

  const contextTitle = order?.title ?? laborTask?.title

  return (
    <div className="h-dvh bg-gray-950 flex flex-col">
      <header className="shrink-0 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/60 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/chats')} className="p-1 -ml-1 text-gray-500 hover:text-gray-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
          {peer?.photo_url ? <img src={peer.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-gray-600" />}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-white text-sm truncate">{peer ? `${peer.first_name} ${peer.last_name ?? ''}`.trim() : '…'}</p>
          {contextTitle && <p className="text-xs text-gray-500 truncate">{contextTitle}</p>}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {isLoading && <Spinner className="mt-16" />}
        {messages?.map((m) => {
          const mine = m.sender_id === profile.id
          return (
            <div
              key={m.id}
              className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${mine ? 'self-end bg-orange-500 text-white rounded-br-sm' : 'self-start bg-gray-800 text-gray-100 rounded-bl-sm'}`}
            >
              {m.text}
            </div>
          )
        })}
        {!isLoading && messages?.length === 0 && (
          <p className="text-center text-sm text-gray-600 mt-10">Напишите первое сообщение</p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-gray-800/60 px-3 py-3 flex items-center gap-2 bg-gray-950" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
          placeholder="Сообщение..."
          className="flex-1 px-3.5 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-100 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 placeholder:text-gray-600"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sendMessage.isPending}
          className="w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 flex items-center justify-center text-white transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
