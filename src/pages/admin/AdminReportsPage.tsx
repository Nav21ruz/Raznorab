import { useState } from 'react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Flag } from 'lucide-react'
import { Spinner } from '../../components/shared/Spinner'
import { useAllReports, useUpdateReportStatus, useBanUser } from '../../hooks/useModeration'
import { useProfileById } from '../../hooks/useProfile'
import { useOrder } from '../../hooks/useOrders'
import { useLaborTask } from '../../hooks/useLabor'
import { REPORT_STATUS_LABELS, REPORT_TARGET_LABELS, type Report, type ReportStatus } from '../../types/marketplace'

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: 'bg-copper-500/15 text-copper-400',
  reviewed: 'bg-blue-500/15 text-blue-400',
  dismissed: 'bg-gray-700/50 text-gray-400',
  actioned: 'bg-red-500/15 text-red-400',
}

const FILTERS: { value: ReportStatus | 'all'; label: string }[] = [
  { value: 'pending', label: 'Новые' },
  { value: 'all', label: 'Все' },
  { value: 'reviewed', label: 'Рассмотренные' },
  { value: 'dismissed', label: 'Отклонённые' },
  { value: 'actioned', label: 'Приняты меры' },
]

export function AdminReportsPage() {
  const { data: reports, isLoading } = useAllReports()
  const [filter, setFilter] = useState<ReportStatus | 'all'>('pending')

  const filtered = (reports ?? []).filter((r) => filter === 'all' || r.status === filter)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-4">Жалобы</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${filter === value ? 'bg-copper-500 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && <Spinner className="mt-16" />}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Flag className="w-8 h-8 text-gray-700" />
          </div>
          <p className="text-gray-400 font-medium">Нет жалоб в этой категории</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((report) => <ReportRow key={report.id} report={report} />)}
      </div>
    </div>
  )
}

function ReportRow({ report }: { report: Report }) {
  const updateStatus = useUpdateReportStatus()
  const banUser = useBanUser()
  const { data: reporter } = useProfileById(report.reporter_id)
  const { data: order } = useOrder(report.target_type === 'order' ? report.target_id : undefined)
  const { data: task } = useLaborTask(report.target_type === 'labor_task' ? report.target_id : undefined)
  const { data: targetProfile } = useProfileById(report.target_type === 'profile' ? report.target_id : undefined)

  const authorId = report.target_type === 'profile' ? report.target_id : report.target_type === 'order' ? order?.customer_id : task?.customer_id
  const targetLabel = report.target_type === 'order'
    ? order?.title
    : report.target_type === 'labor_task'
      ? task?.title
      : targetProfile ? `${targetProfile.first_name} ${targetProfile.last_name ?? ''}`.trim() : undefined

  const handleBan = () => {
    if (!authorId) return
    if (!window.confirm('Забанить автора? Он не сможет публиковать заказы, задачи, отклики и сообщения.')) return
    banUser.mutate(
      { profileId: authorId, reason: report.reason },
      {
        onSuccess: () => {
          toast.success('Пользователь забанен')
          updateStatus.mutate({ id: report.id, status: 'actioned' })
        },
        onError: () => toast.error('Не удалось забанить пользователя (возможно, уже забанен)'),
      },
    )
  }

  return (
    <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <span className="px-2 py-0.5 rounded-md bg-gray-800 text-xs text-gray-400">{REPORT_TARGET_LABELS[report.target_type]}</span>
        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[report.status]}`}>{REPORT_STATUS_LABELS[report.status]}</span>
      </div>

      <p className="font-semibold text-white mb-1">{targetLabel ?? '…'}</p>
      <p className="text-sm text-copper-400 mb-1">{report.reason}</p>
      {report.comment && <p className="text-sm text-gray-400 mb-2">{report.comment}</p>}
      <p className="text-xs text-gray-600 mb-3">
        От: {reporter ? `${reporter.first_name} ${reporter.last_name ?? ''}`.trim() : '…'}
        {' · '}
        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ru })}
      </p>

      {report.status === 'pending' && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => updateStatus.mutate({ id: report.id, status: 'reviewed' })}
            className="px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-xs font-medium transition-colors"
          >
            Рассмотрено
          </button>
          <button
            onClick={() => updateStatus.mutate({ id: report.id, status: 'dismissed' })}
            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
          >
            Отклонить
          </button>
          {authorId && (
            <button
              onClick={handleBan}
              disabled={banUser.isPending}
              className="px-3 py-1.5 rounded-lg bg-red-600/15 hover:bg-red-600/25 text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
            >
              Забанить автора
            </button>
          )}
        </div>
      )}
    </div>
  )
}
