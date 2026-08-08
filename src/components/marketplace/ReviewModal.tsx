import { useState } from 'react'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '../shared/Modal'
import { Button } from '../shared/Button'
import { useCreateReview } from '../../hooks/useReviews'

interface Props {
  open: boolean
  onClose: () => void
  conversationId: string
  peerName: string
}

export function ReviewModal({ open, onClose, conversationId, peerName }: Props) {
  const createReview = useCreateReview(conversationId)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')

  const handleClose = () => {
    onClose()
    setRating(0)
    setComment('')
  }

  const handleSubmit = () => {
    if (!rating) {
      toast.error('Поставьте оценку от 1 до 5 звёзд')
      return
    }
    createReview.mutate(
      { rating, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Спасибо за отзыв!')
          handleClose()
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Не удалось отправить отзыв'),
      },
    )
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Оценить: ${peerName}`}>
      <div className="flex flex-col gap-4">
        <div className="flex justify-center gap-1.5" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHovered(n)}
              className="p-1"
              aria-label={`${n} из 5`}
            >
              <Star
                className={`w-8 h-8 transition-colors ${n <= (hovered || rating) ? 'text-copper-400 fill-copper-400' : 'text-gray-700'}`}
              />
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-400">Комментарий (необязательно)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-100 outline-none focus:border-copper-500 focus:ring-1 focus:ring-copper-500/30 resize-none placeholder:text-gray-600 transition-all"
            placeholder="Как прошла работа?"
          />
        </div>

        <Button onClick={handleSubmit} loading={createReview.isPending} className="w-full justify-center">
          Отправить отзыв
        </Button>
      </div>
    </Modal>
  )
}
