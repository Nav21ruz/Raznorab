import { useEffect, useState } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, MapPin, Wallet, Calendar, User, Flag } from 'lucide-react'
import { Button } from '../../components/shared/Button'
import { Spinner } from '../../components/shared/Spinner'
import { ReportModal } from '../../components/marketplace/ReportModal'
import { useLaborTask, useMyLaborResponse, useRespondToLaborTask, useTaskResponses, useAcceptLaborResponse, useMarkLaborResponsesSeen } from '../../hooks/useLabor'
import { useMyConversations } from '../../hooks/useConversations'
import { PAY_TYPE_LABELS, type Profile } from '../../types/marketplace'

export function LaborTaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useOutletContext<{ profile: Profile }>()
  const { data: task, isLoading } = useLaborTask(id)
  const isOwner = task?.customer_id === profile.id
  const [showReport, setShowReport] = useState(false)

  if (isLoading) {
    return <div className="max-w-lg mx-auto px-4 pt-6"><Spinner className="mt-16" /></div>
  }
  if (!task) return null

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-white flex-1">Задача</h1>
        {!isOwner && (
          <button onClick={() => setShowReport(true)} className="p-2 -mr-2 text-gray-500 hover:text-red-400" aria-label="Пожаловаться на задачу">
            <Flag className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl mb-4">
        <h2 className="text-lg font-bold text-white mb-2">{task.title}</h2>
        <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-3">
          {task.pay_amount && (
            <span className="flex items-center gap-1.5 text-copper-400 font-medium">
              <Wallet className="w-4 h-4" />{task.pay_amount.toLocaleString('ru-RU')} ₽ {PAY_TYPE_LABELS[task.pay_type]}
            </span>
          )}
          {task.city && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{task.city}</span>}
          {task.date_needed && (
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(task.date_needed).toLocaleDateString('ru-RU')}</span>
          )}
        </div>
        <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{task.description}</p>
      </div>

      {isOwner ? (
        <OwnerResponses taskId={task.id} taskStatus={task.status} customerId={profile.id} />
      ) : (
        <LaborerRespond taskId={task.id} laborerId={profile.id} />
      )}

      <ReportModal open={showReport} onClose={() => setShowReport(false)} targetType="labor_task" targetId={task.id} />
    </div>
  )
}

function LaborerRespond({ taskId, laborerId }: { taskId: string; laborerId: string }) {
  const navigate = useNavigate()
  const { data: myResponse, isLoading } = useMyLaborResponse(taskId, laborerId)
  const { data: conversations } = useMyConversations(laborerId)
  const respond = useRespondToLaborTask()
  const [message, setMessage] = useState('')

  const match = conversations?.find((c) => c.labor_task_id === taskId)

  if (isLoading) return <Spinner className="mt-8" />

  if (match) {
    return (
      <Button onClick={() => navigate(`/chats/${match.id}`)} className="w-full justify-center">
        Вас выбрали! Перейти в чат
      </Button>
    )
  }

  if (myResponse) {
    return <p className="text-center text-sm text-gray-500 py-4">Вы откликнулись на эту задачу. Ждите решения заказчика.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder="Сообщение заказчику (необязательно)"
        className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-100 outline-none focus:border-copper-500 focus:ring-1 focus:ring-copper-500/30 resize-none placeholder:text-gray-600"
      />
      <Button
        loading={respond.isPending}
        onClick={() => respond.mutate(
          { taskId, message: message.trim() || null },
          {
            onSuccess: () => toast.success('Отклик отправлен'),
            onError: () => toast.error('Не удалось отправить отклик'),
          },
        )}
        className="w-full justify-center"
      >
        Откликнуться
      </Button>
    </div>
  )
}

function OwnerResponses({ taskId, taskStatus, customerId }: { taskId: string; taskStatus: string; customerId: string }) {
  const navigate = useNavigate()
  const { data: responses, isLoading } = useTaskResponses(taskId)
  const { data: conversations } = useMyConversations(customerId)
  const accept = useAcceptLaborResponse()
  const markSeen = useMarkLaborResponsesSeen()
  const markSeenMutate = markSeen.mutate

  // Заказчик открыл список откликов — значит увидел их, снимаем значок "новое"
  useEffect(() => {
    markSeenMutate(taskId)
  }, [taskId, markSeenMutate])

  const conversationByLaborer = new Map(
    (conversations ?? []).filter((c) => c.labor_task_id === taskId).map((c) => [c.worker_id, c]),
  )

  if (isLoading) return <Spinner className="mt-8" />

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 mb-3">Отклики{responses?.length ? ` (${responses.length})` : ''}</h3>
      {responses?.length === 0 && <p className="text-sm text-gray-600">Пока никто не откликнулся</p>}
      <div className="flex flex-col gap-2">
        {responses?.map(({ response, profile: laborer }) => {
          const conv = conversationByLaborer.get(laborer.id)
          return (
            <div key={response.id} className="p-3 bg-gray-900 border border-gray-800 rounded-xl">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                  {laborer.photo_url ? <img src={laborer.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-gray-600" />}
                </div>
                <p className="font-medium text-white text-sm">{laborer.first_name} {laborer.last_name ?? ''}</p>
              </div>
              {response.message && <p className="text-sm text-gray-400 mb-2">{response.message}</p>}

              {conv ? (
                <button
                  onClick={() => navigate(`/chats/${conv.id}`)}
                  className="w-full py-1.5 rounded-lg bg-copper-500 hover:bg-copper-400 text-white text-xs font-medium transition-colors"
                >
                  Перейти в чат
                </button>
              ) : taskStatus === 'active' ? (
                <button
                  onClick={() => accept.mutate(
                    { taskId, laborerId: laborer.id },
                    {
                      onSuccess: () => toast.success('Вы выбрали исполнителя'),
                      onError: () => toast.error('Не удалось выбрать исполнителя'),
                    },
                  )}
                  disabled={accept.isPending}
                  className="w-full py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  Выбрать
                </button>
              ) : (
                <p className="text-xs text-gray-600">Задача закрыта</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
