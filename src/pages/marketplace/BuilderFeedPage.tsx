import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import { HardHat } from 'lucide-react'
import { SwipeDeck } from '../../components/marketplace/SwipeDeck'
import { OrderCard } from '../../components/marketplace/OrderCard'
import { Spinner } from '../../components/shared/Spinner'
import { Input } from '../../components/shared/Input'
import { FilterPanel } from '../../components/shared/FilterPanel'
import { useOrdersFeed } from '../../hooks/useOrders'
import { useSwipeOrder } from '../../hooks/useSwipes'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { BUILDER_CATEGORIES, type Order, type OrderFeedFilters, type Profile } from '../../types/marketplace'
import type { SwipeDirection } from '../../components/marketplace/SwipeCard'

export function BuilderFeedPage() {
  const { profile } = useOutletContext<{ profile: Profile }>()
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('')
  const [search, setSearch] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')

  const debouncedCity = useDebouncedValue(city)
  const debouncedSearch = useDebouncedValue(search)
  const debouncedBudgetMin = useDebouncedValue(budgetMin)
  const debouncedBudgetMax = useDebouncedValue(budgetMax)

  const filters: OrderFeedFilters = useMemo(() => ({
    category: category || undefined,
    city: debouncedCity || undefined,
    search: debouncedSearch || undefined,
    budgetMin: debouncedBudgetMin ? Number(debouncedBudgetMin) : undefined,
    budgetMax: debouncedBudgetMax ? Number(debouncedBudgetMax) : undefined,
  }), [category, debouncedCity, debouncedSearch, debouncedBudgetMin, debouncedBudgetMax])

  const activeCount = Object.values(filters).filter((v) => v !== undefined).length

  const { data: orders, isLoading } = useOrdersFeed(profile.id, filters)
  const swipeOrder = useSwipeOrder()

  const resetFilters = () => {
    setCategory('')
    setCity('')
    setSearch('')
    setBudgetMin('')
    setBudgetMax('')
  }

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

      <FilterPanel activeCount={activeCount} onReset={resetFilters}>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-400">Категория</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-sm text-gray-100 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
          >
            <option value="">Любая категория</option>
            {BUILDER_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Input label="Город" placeholder="Например, Москва" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input label="Поиск по названию/описанию" placeholder="Например, плитка" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Бюджет от" type="number" inputMode="numeric" placeholder="0" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
          <Input label="Бюджет до" type="number" inputMode="numeric" placeholder="∞" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
        </div>
      </FilterPanel>

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
              <p className="text-gray-400 font-medium">{activeCount > 0 ? 'По этим фильтрам заказов не нашлось' : 'Новых заказов пока нет'}</p>
              <p className="text-sm text-gray-600 mt-1">
                {activeCount > 0 ? 'Попробуйте изменить или сбросить фильтры' : 'Загляните позже — заказчики публикуют новые задачи каждый день'}
              </p>
            </div>
          }
        />
      )}
    </div>
  )
}
