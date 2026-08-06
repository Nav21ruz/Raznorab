import { useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { Plus, Wrench, MapPin, Wallet, Users2 } from 'lucide-react'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/shared/Button'
import { Spinner } from '../../components/shared/Spinner'
import { LaborTaskForm } from '../../components/marketplace/LaborTaskForm'
import { useMyLaborTasks, useTaskResponses } from '../../hooks/useLabor'
import { PAY_TYPE_LABELS, type LaborTask, type Profile } from '../../types/marketplace'

export function MyLaborTasksPage() {
  const { profile } = useOutletContext<{ profile: Profile }>()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const { data: tasks, isLoading } = useMyLaborTasks(profile.id)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Разнорабочие</h1>
          <p className="text-sm text-gray-500 mt-1">{tasks?.length ? `${tasks.length} задач(и)` : 'Опубликуйте разовую задачу'}</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="w-4 h-4" /> Задача
        </Button>
      </div>

      {isLoading && <Spinner className="mt-16" />}

      {!isLoading && tasks?.length === 0 && (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-8 h-8 text-gray-700" />
          </div>
          <p className="text-gray-400 font-medium">Нет задач</p>
          <p className="text-sm text-gray-600 mt-1">Нужен разнорабочий на разовую подработку? Опубликуйте задачу</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {tasks?.map((task) => <TaskRow key={task.id} task={task} onOpen={() => navigate(`/labor/${task.id}`)} />)}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Новая задача">
        <LaborTaskForm onSuccess={() => setShowForm(false)} />
      </Modal>
    </div>
  )
}

function TaskRow({ task, onOpen }: { task: LaborTask; onOpen: () => void }) {
  const { data: responses } = useTaskResponses(task.id)

  return (
    <button
      onClick={onOpen}
      className="p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 active:scale-[0.99] transition-all text-left"
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <h3 className="font-semibold text-white">{task.title}</h3>
        <span className={`shrink-0 px-2 py-1 rounded-lg text-xs font-medium ${task.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-700/50 text-gray-400'}`}>
          {task.status === 'active' ? 'Активна' : 'Закрыта'}
        </span>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        {task.pay_amount && (
          <span className="flex items-center gap-1"><Wallet className="w-3.5 h-3.5" />{task.pay_amount.toLocaleString('ru-RU')} ₽ {PAY_TYPE_LABELS[task.pay_type]}</span>
        )}
        {task.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{task.city}</span>}
        {!!responses?.length && (
          <span className="flex items-center gap-1 text-orange-400"><Users2 className="w-3.5 h-3.5" />{responses.length} отклик(ов)</span>
        )}
      </div>
    </button>
  )
}
