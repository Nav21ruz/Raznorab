import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, MapPin, Wallet, Calendar } from 'lucide-react'
import { Spinner } from '../../components/shared/Spinner'
import { Input } from '../../components/shared/Input'
import { FilterPanel } from '../../components/shared/FilterPanel'
import { useLaborFeed } from '../../hooks/useLabor'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { PAY_TYPE_LABELS, type LaborFeedFilters, type PayType } from '../../types/marketplace'

export function LaborFeedPage() {
  const navigate = useNavigate()
  const [city, setCity] = useState('')
  const [search, setSearch] = useState('')
  const [payType, setPayType] = useState<PayType | ''>('')
  const [payMin, setPayMin] = useState('')

  const debouncedCity = useDebouncedValue(city)
  const debouncedSearch = useDebouncedValue(search)
  const debouncedPayMin = useDebouncedValue(payMin)

  const filters: LaborFeedFilters = useMemo(() => ({
    city: debouncedCity || undefined,
    search: debouncedSearch || undefined,
    payType: payType || undefined,
    payMin: debouncedPayMin ? Number(debouncedPayMin) : undefined,
  }), [debouncedCity, debouncedSearch, payType, debouncedPayMin])

  const activeCount = Object.values(filters).filter((v) => v !== undefined).length

  const { data: tasks, isLoading } = useLaborFeed(filters)

  const resetFilters = () => {
    setCity('')
    setSearch('')
    setPayType('')
    setPayMin('')
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Задачи рядом</h1>
        <p className="text-sm text-text-muted mt-1">Разовые подработки от заказчиков</p>
      </div>

      <FilterPanel activeCount={activeCount} onReset={resetFilters}>
        <Input label="Город" placeholder="Например, Москва" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input label="Поиск по названию/описанию" placeholder="Например, разгрузка" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Тип оплаты</label>
          <select
            value={payType}
            onChange={(e) => setPayType(e.target.value as PayType | '')}
            className="px-3 py-2.5 bg-bg-page border border-border-2 rounded-xl text-sm text-text-primary outline-none focus:border-copper-500 focus:ring-1 focus:ring-copper-500/30"
          >
            <option value="">Любой</option>
            {(Object.keys(PAY_TYPE_LABELS) as PayType[]).map((t) => <option key={t} value={t}>{PAY_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <Input label="Оплата от, ₽" type="number" inputMode="numeric" placeholder="0" value={payMin} onChange={(e) => setPayMin(e.target.value)} />
      </FilterPanel>

      {isLoading && <Spinner className="mt-16" />}

      {!isLoading && tasks?.length === 0 && (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-bg-card border border-border-1 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-secondary font-medium">{activeCount > 0 ? 'По этим фильтрам задач не нашлось' : 'Пока нет задач'}</p>
          <p className="text-sm text-text-muted mt-1">
            {activeCount > 0 ? 'Попробуйте изменить или сбросить фильтры' : 'Загляните позже — заказчики публикуют новые задачи каждый день'}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {tasks?.map((task) => (
          <button
            key={task.id}
            onClick={() => navigate(`/labor/${task.id}`)}
            className="p-4 bg-bg-card border border-border-1 rounded-2xl hover:border-border-2 active:scale-[0.99] transition-all text-left"
          >
            <h3 className="font-semibold text-text-primary mb-1.5">{task.title}</h3>
            <p className="text-sm text-text-secondary line-clamp-2 mb-3">{task.description}</p>
            <div className="flex flex-wrap gap-3 text-xs text-text-muted">
              {task.pay_amount && (
                <span className="flex items-center gap-1 text-copper-hover font-medium">
                  <Wallet className="w-3.5 h-3.5" /> {task.pay_amount.toLocaleString('ru-RU')} ₽ {PAY_TYPE_LABELS[task.pay_type]}
                </span>
              )}
              {task.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{task.city}</span>}
              {task.date_needed && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {new Date(task.date_needed).toLocaleDateString('ru-RU')}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
