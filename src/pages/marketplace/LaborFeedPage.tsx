import { useNavigate } from 'react-router-dom'
import { Wrench, MapPin, Wallet, Calendar } from 'lucide-react'
import { Spinner } from '../../components/shared/Spinner'
import { useLaborFeed } from '../../hooks/useLabor'
import { PAY_TYPE_LABELS } from '../../types/marketplace'

export function LaborFeedPage() {
  const navigate = useNavigate()
  const { data: tasks, isLoading } = useLaborFeed()

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Задачи рядом</h1>
        <p className="text-sm text-gray-500 mt-1">Разовые подработки от заказчиков</p>
      </div>

      {isLoading && <Spinner className="mt-16" />}

      {!isLoading && tasks?.length === 0 && (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-8 h-8 text-gray-700" />
          </div>
          <p className="text-gray-400 font-medium">Пока нет задач</p>
          <p className="text-sm text-gray-600 mt-1">Загляните позже — заказчики публикуют новые задачи каждый день</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {tasks?.map((task) => (
          <button
            key={task.id}
            onClick={() => navigate(`/labor/${task.id}`)}
            className="p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 active:scale-[0.99] transition-all text-left"
          >
            <h3 className="font-semibold text-white mb-1.5">{task.title}</h3>
            <p className="text-sm text-gray-400 line-clamp-2 mb-3">{task.description}</p>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              {task.pay_amount && (
                <span className="flex items-center gap-1 text-orange-400 font-medium">
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
