import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { Send, ArrowLeft, User, Flag, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useConversation, useMarkConversationRead, useMessages, useSendMessage } from '../../hooks/useConversations'
import { useProfileById } from '../../hooks/useProfile'
import { useOrder } from '../../hooks/useOrders'
import { useLaborTask } from '../../hooks/useLabor'
import { useBannedWords } from '../../hooks/useModeration'
import { useMyReview } from '../../hooks/useReviews'
import { containsProfanity, maskProfanity } from '../../lib/profanity'
import { Spinner } from '../../components/shared/Spinner'
import { ReportModal } from '../../components/marketplace/ReportModal'
import { ReviewModal } from '../../components/marketplace/ReviewModal'
import type { Profile } from '../../types/marketplace'

export function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useOutletContext<{ profile: Profile }>()
  const { data: conversation } = useConversation(id)
  const { data: messages, isLoading } = useMessages(id)
  const sendMessage = useSendMessage(id ?? '')
  const markRead = useMarkConversationRead(id)
  const { data: bannedWords } = useBannedWords()
  const [text, setText] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const peerId = conversation ? (conversation.customer_id === profile.id ? conversation.worker_id : conversation.customer_id) : undefined
  const { data: peer } = useProfileById(peerId)
  const { data: myReview, isLoading: myReviewLoading } = useMyReview(id)
  const { data: order } = useOrder(conversation?.kind === 'order' ? conversation.order_id ?? undefined : undefined)
  const { data: laborTask } = useLaborTask(conversation?.kind === 'labor' ? conversation.labor_task_id ?? undefined : undefined)

  // Отмечаем чат прочитанным при открытии и повторно при каждом новом сообщении,
  // пришедшем во время просмотра (иначе оно бы всё равно засчиталось непрочитанным).
  const markReadMutate = markRead.mutate
  useEffect(() => {
    if (!id) return
    markReadMutate()
  }, [id, messages?.length, markReadMutate])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.length])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    const patterns = (bannedWords ?? []).map((w) => w.pattern)
    const toSend = containsProfanity(trimmed, patterns) ? maskProfanity(trimmed, patterns) : trimmed
    setText('')
    sendMessage.mutate(toSend, {
      onError: () => {
        toast.error('Не удалось отправить сообщение')
        setText(trimmed)
      },
    })
  }

  const contextTitle = order?.title ?? laborTask?.title

  return (
    <div className="h-dvh bg-bg-page flex flex-col">
      <header className="shrink-0 bg-bg-page/95 backdrop-blur-md border-b border-border-1/60 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/chats')} className="p-1 -ml-1 text-text-muted hover:text-text-secondary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-lg bg-border-1 flex items-center justify-center overflow-hidden shrink-0">
          {peer?.photo_url ? <img src={peer.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-text-muted" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text-primary text-sm truncate">{peer ? `${peer.first_name} ${peer.last_name ?? ''}`.trim() : '…'}</p>
          {contextTitle && <p className="text-xs text-text-muted truncate">{contextTitle}</p>}
        </div>
        {peer && !myReviewLoading && !myReview && (
          <button onClick={() => setShowReview(true)} className="p-2 text-text-muted hover:text-copper-hover shrink-0" aria-label="Оставить отзыв">
            <Star className="w-4 h-4" />
          </button>
        )}
        {peer && (
          <button onClick={() => setShowReport(true)} className="p-2 -mr-1 text-text-muted hover:text-error-text shrink-0" aria-label="Пожаловаться на пользователя">
            <Flag className="w-4 h-4" />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {isLoading && <Spinner className="mt-16" />}
        {messages?.map((m) => {
          const mine = m.sender_id === profile.id
          return (
            <div
              key={m.id}
              className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${mine ? 'self-end bg-copper-500 text-white rounded-br-sm' : 'self-start bg-border-1 text-text-primary rounded-bl-sm'}`}
            >
              {m.text}
            </div>
          )
        })}
        {!isLoading && messages?.length === 0 && (
          <p className="text-center text-sm text-text-muted mt-10">Напишите первое сообщение</p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-border-1/60 px-3 py-3 flex items-center gap-2 bg-bg-page" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
          placeholder="Сообщение..."
          className="flex-1 px-3.5 py-2.5 bg-bg-card border border-border-2 rounded-xl text-sm text-text-primary outline-none focus:border-copper-500 focus:ring-1 focus:ring-copper-500/30 placeholder:text-text-muted"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sendMessage.isPending}
          className="w-10 h-10 rounded-xl bg-copper-500 hover:bg-copper-hover disabled:opacity-40 flex items-center justify-center text-white transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {peer && (
        <>
          <ReportModal open={showReport} onClose={() => setShowReport(false)} targetType="profile" targetId={peer.id} />
          {id && (
            <ReviewModal
              open={showReview}
              onClose={() => setShowReview(false)}
              conversationId={id}
              peerName={`${peer.first_name} ${peer.last_name ?? ''}`.trim()}
            />
          )}
        </>
      )}
    </div>
  )
}
