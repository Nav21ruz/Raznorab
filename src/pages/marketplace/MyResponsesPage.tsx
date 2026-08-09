import { useOutletContext, useNavigate } from 'react-router-dom'
import { Inbox, MapPin, Wallet, MessageCircle, Clock, XCircle } from 'lucide-react'
import { Spinner } from '../../components/shared/Spinner'
import { useMyOrderResponses } from '../../hooks/useSwipes'
import { useMyConversations } from '../../hooks/useConversations'
import type { Profile } from '../../types/marketplace'

export function MyResponsesPage() {
  const { profile } = useOutletContext<{ profile: Profile }>()
  const navigate = useNavigate()
  const { data: responses, isLoading } = useMyOrderResponses(profile.id)
  const { data: conversations } = useMyConversations(profile.id)

  const matchByOrderId = new Map((conversations ?? []).filter((c) => c.order_id).map((c) => [c.order_id as string, c]))

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Мои отклики</h1>
        <p className="text-sm text-text-muted mt-1">
          {responses?.length ? `${responses.length} отклик(ов)` : 'Здесь появятся заказы, на которые вы откликнулись'}
        </p>
      </div>

      {isLoading && <Spinner className="mt-16" />}

      {!isLoading && responses?.length === 0 && (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-bg-card border border-border-1 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-secondary font-medium">Пока нет откликов</p>
          <p className="text-sm text-text-muted mt-1">Свайпайте заказы в ленте, чтобы откликнуться</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {responses?.map(({ order, swipe }) => {
          const match = matchByOrderId.get(order.id)
          const rejected = !match && swipe.reviewed_by_customer
          return (
            <div key={order.id} className="p-4 bg-bg-card border border-border-1 rounded-2xl">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-border-1 text-xs text-text-secondary mb-1.5">{order.category}</span>
                  <h3 className="font-semibold text-text-primary truncate">{order.title}</h3>
                  <div className="flex flex-wrap gap-3 text-xs text-text-muted mt-1.5">
                    {(order.budget_from || order.budget_to) && (
                      <span className="flex items-center gap-1"><Wallet className="w-3 h-3" />
                        {order.budget_from && order.budget_to ? `${order.budget_from}–${order.budget_to} ₽` : `${order.budget_from ?? order.budget_to} ₽`}
                      </span>
                    )}
                    {order.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{order.city}</span>}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border-1">
                {match ? (
                  <button
                    onClick={() => navigate(`/chats/${match.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-copper-500 hover:bg-copper-hover text-white text-sm font-medium transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> Мэтч! Перейти в чат
                  </button>
                ) : rejected ? (
                  <p className="flex items-center justify-center gap-1.5 text-xs text-text-muted py-2">
                    <XCircle className="w-3.5 h-3.5" /> Заказчик выбрал другого исполнителя
                  </p>
                ) : (
                  <p className="flex items-center justify-center gap-1.5 text-xs text-text-muted py-2">
                    <Clock className="w-3.5 h-3.5" /> Ожидаем ответа заказчика
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
