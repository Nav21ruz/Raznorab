import { useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import { HardHat } from 'lucide-react'
import { SwipeDeck } from '../../components/marketplace/SwipeDeck'
import { OrderCard } from '../../components/marketplace/OrderCard'
import { Spinner } from '../../components/shared/Spinner'
import { useOrdersFeed } from '../../hooks/useOrders'
import { useSwipeOrder } from '../../hooks/useSwipes'
import type { Order, Profile } from '../../types/marketplace'
import type { SwipeDirection } from '../../components/marketplace/SwipeCard'

export function BuilderFeedPage() {
  const { profile } = useOutletContext<{ profile: Profile }>()
  const { data: orders, isLoading } = useOrdersFeed(profile.id)
  const swipeOrder = useSwipeOrder()

  const handleDecide = (order: Order, direction: SwipeDirection) => {
    swipeOrder.mutate(
      { orderId: order.id, direction },
      {
        onSuccess: () => { if (direction === 'like') toast.success('Отклик отправлен заказчику') },
        onError: () => toast.error('Не удалось сохранить свайп'),
      },
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Лента заказов</h1>
        <p className="text-sm text-gray-500 mt-1">Свайп вправо — откликнуться, влево — пропустить</p>
      </div>

      {isLoading && <Spinner className="mt-16" />}

      {!isLoading && (
        <SwipeDeck
          items={orders ?? []}
          keyExtractor={(o) => o.id}
          renderCard={(o) => <OrderCard order={o} />}
          onDecide={handleDecide}
          emptyState={
            <div className="text-center py-24">
              <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <HardHat className="w-8 h-8 text-gray-700" />
              </div>
              <p className="text-gray-400 font-medium">Новых заказов пока нет</p>
              <p className="text-sm text-gray-600 mt-1">Загляните позже — заказчики публикуют новые задачи каждый день</p>
            </div>
          }
        />
      )}
    </div>
  )
}
