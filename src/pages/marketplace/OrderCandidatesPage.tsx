import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Users2 } from 'lucide-react'
import { SwipeDeck } from '../../components/marketplace/SwipeDeck'
import { BuilderCandidateCard } from '../../components/marketplace/BuilderCandidateCard'
import { Spinner } from '../../components/shared/Spinner'
import { useOrder } from '../../hooks/useOrders'
import { useOrderCandidates, useConfirmMatch, useRejectCandidate, type OrderCandidate } from '../../hooks/useSwipes'
import type { SwipeDirection } from '../../components/marketplace/SwipeCard'

export function OrderCandidatesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: order } = useOrder(id)
  const { data: candidates, isLoading } = useOrderCandidates(id)
  const confirmMatch = useConfirmMatch()
  const rejectCandidate = useRejectCandidate()

  const handleDecide = (candidate: OrderCandidate, direction: SwipeDirection) => {
    if (!id) return
    if (direction === 'like') {
      confirmMatch.mutate(
        { orderId: id, builderId: candidate.profile.id },
        {
          onSuccess: (conversation) => {
            toast.success('Мэтч! Открываем чат')
            navigate(`/chats/${conversation.id}`)
          },
          onError: () => toast.error('Не удалось создать чат'),
        },
      )
    } else {
      rejectCandidate.mutate({ orderId: id, builderId: candidate.profile.id })
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/orders')} className="p-2 -ml-2 text-text-muted hover:text-text-secondary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Отклики</h1>
          {order && <p className="text-sm text-text-muted">{order.title}</p>}
        </div>
      </div>

      {isLoading && <Spinner className="mt-16" />}

      {!isLoading && (
        <SwipeDeck
          items={candidates ?? []}
          keyExtractor={(c) => c.swipe.id}
          renderCard={(c) => <BuilderCandidateCard profile={c.profile} builderProfile={c.builderProfile} />}
          onDecide={handleDecide}
          emptyState={
            <div className="text-center py-24">
              <div className="w-16 h-16 bg-bg-card border border-border-1 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users2 className="w-8 h-8 text-text-muted" />
              </div>
              <p className="text-text-secondary font-medium">Пока нет откликов</p>
              <p className="text-sm text-text-muted mt-1">Как только строитель откликнётся на заказ, вы увидите его здесь</p>
            </div>
          }
        />
      )}
    </div>
  )
}
