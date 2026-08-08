import { useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '../shared/Modal'
import { Button } from '../shared/Button'
import { useCreateReport } from '../../hooks/useModeration'
import { REPORT_REASONS, type ReportTargetType } from '../../types/marketplace'

interface Props {
  open: boolean
  onClose: () => void
  targetType: ReportTargetType
  targetId: string
}

export function ReportModal({ open, onClose, targetType, targetId }: Props) {
  const createReport = useCreateReport()
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')

  const handleClose = () => {
    onClose()
    setReason('')
    setComment('')
  }

  const handleSubmit = () => {
    if (!reason) {
      toast.error('Выберите причину жалобы')
      return
    }
    createReport.mutate(
      { targetType, targetId, reason, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Жалоба отправлена, мы её рассмотрим')
          handleClose()
        },
        onError: () => toast.error('Не удалось отправить жалобу'),
      },
    )
  }

  return (
    <Modal open={open} onClose={handleClose} title="Пожаловаться">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-400">Причина</label>
          <div className="flex flex-col gap-2">
            {REPORT_REASONS.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setReason(r)}
                className={`text-left px-3 py-2 rounded-xl border text-sm transition-all ${reason === r ? 'bg-copper-500 border-copper-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-600'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-400">Комментарий (необязательно)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-100 outline-none focus:border-copper-500 focus:ring-1 focus:ring-copper-500/30 resize-none placeholder:text-gray-600 transition-all"
            placeholder="Опишите подробнее, если нужно"
          />
        </div>

        <Button onClick={handleSubmit} loading={createReport.isPending} variant="danger" className="w-full justify-center">
          Отправить жалобу
        </Button>
      </div>
    </Modal>
  )
}
