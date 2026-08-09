import { useState } from 'react'
import { MapPin, Wallet, HardHat, ImageOff, Flag } from 'lucide-react'
import { CardShell } from './CardShell'
import { ReportModal } from './ReportModal'
import type { Order } from '../../types/marketplace'

function formatBudget(order: Order) {
  if (!order.budget_from && !order.budget_to) return 'Бюджет не указан'
  if (order.budget_from && order.budget_to) return `${order.budget_from.toLocaleString('ru-RU')} – ${order.budget_to.toLocaleString('ru-RU')} ₽`
  if (order.budget_from) return `от ${order.budget_from.toLocaleString('ru-RU')} ₽`
  return `до ${order.budget_to!.toLocaleString('ru-RU')} ₽`
}

export function OrderCard({ order }: { order: Order }) {
  const photo = order.photos[0]
  const [showReport, setShowReport] = useState(false)

  return (
    <CardShell>
      <div className="relative h-56 bg-border-1 flex items-center justify-center shrink-0">
        {photo ? (
          <img src={photo} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageOff className="w-10 h-10 text-text-muted" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-900 to-transparent" />
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-copper-500 text-white text-xs font-semibold">
          {order.category}
        </span>
        <button
          type="button"
          onPointerDownCapture={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); setShowReport(true) }}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-bg-page/60 backdrop-blur-sm flex items-center justify-center text-text-secondary hover:text-error-text transition-colors"
          aria-label="Пожаловаться на заказ"
        >
          <Flag className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1 overflow-y-auto">
        <h3 className="text-lg font-bold text-text-primary leading-snug">{order.title}</h3>

        <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
          <span className="flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-copper-hover" />
            {formatBudget(order)}
          </span>
          {order.city && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-copper-hover" />
              {order.city}{order.address ? `, ${order.address}` : ''}
            </span>
          )}
        </div>

        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{order.description}</p>
      </div>

      <div className="px-5 py-3 border-t border-border-1 flex items-center gap-2 text-xs text-text-muted shrink-0">
        <HardHat className="w-3.5 h-3.5" />
        Заказ от частного заказчика
      </div>

      <ReportModal open={showReport} onClose={() => setShowReport(false)} targetType="order" targetId={order.id} />
    </CardShell>
  )
}
