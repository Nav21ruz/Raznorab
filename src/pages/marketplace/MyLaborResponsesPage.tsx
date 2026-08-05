import { useOutletContext, useNavigate } from 'react-router-dom'
import { Inbox, MapPin, Wallet, MessageCircle, Clock } from 'lucide-react'
import { Spinner } from '../../components/shared/Spinner'
import { useMyLaborResponses } from '../../hooks/useLabor'
import { useMyConversations } from '../../hooks/useConversations'
import { PAY_TYPE_LABELS, type Profile } from '../../types/marketplace'

export function MyLaborResponsesPage() {
  const { profile } = useOutletContext<{ profile: Profile }>()
  const navigate = useNavigate()
  const { data: responses, isLoading } = useMyLaborResponses(profile.id)
  const { data: conversations } = useMyConversations(profile.id)

  const matchByTaskId = new Map((conversations ?? []).filter((c) => c.labor_task_id).map((c) => [c.labor_task_id as string, c]))

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Мои отклики</h1>
        <p className="text-sm text-gray-500 mt-1">
          {responses?.length ? `${responses.length} отклик(ов)` : 'Здесь появятся задачи, на которые вы откликнулись'}
        </p>
      </div>

      {isLoading && <Spinner className="mt-16" />}

      {!isLoading && responses?.length === 0 && (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8 text-gray-700" />
          </div>
          <p className="text-gray-400 font-medium">Пока нет откликов</p>
          <p className="text-sm text-gray-600 mt-1">Откликнитесь на задачу в ленте, чтобы она появилась здесь</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {responses?.map(({ task }) => {
          const match = matchByTaskId.get(task.id)
          return (
            <div key={task.id} className="p-4 bg-gray-900 border border-gray-800 rounded-2xl">
              <h3 className="font-semibold text-white mb-1.5">{task.title}</h3>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                {task.pay_amount && (
                  <span className="flex items-center gap-1"><Wallet className="w-3 h-3" />{task.pay_amount.toLocaleString('ru-RU')} ₽ {PAY_TYPE_LABELS[task.pay_type]}</span>
                )}
                {task.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{task.city}</span>}
              </div>

              <div className="pt-3 border-t border-gray-800">
                {match ? (
                  <button
                    onClick={() => navigate(`/chats/${match.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> Вас выбрали! Перейти в чат
                  </button>
                ) : (
                  <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500 py-2">
                    <Clock className="w-3.5 h-3.5" /> Ждём решения заказчика
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
