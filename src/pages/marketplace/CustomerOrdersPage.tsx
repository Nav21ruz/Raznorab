import { useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { Plus, ClipboardList, MapPin, Wallet, Users2 } from 'lucide-react'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/shared/Button'
import { Spinner } from '../../components/shared/Spinner'
import { OrderForm } from '../../components/marketplace/OrderForm'
import { useMyOrders, useUpdateOrderStatus } from '../../hooks/useOrders'
import { useOrderCandidates } from '../../hooks/useSwipes'
import type { Order, Profile, OrderStatus } from '../../types/marketplace'

const STATUS_LABELS: Record<OrderStatus, string> = {
  active: 'Активен',
  in_progress: 'В работе',
  done: 'Завершён',
  cancelled: 'Отменён',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-400',
  in_progress: 'bg-orange-500/15 text-orange-400',
  done: 'bg-gray-700/50 text-gray-400',
  cancelled: 'bg-red-500/15 text-red-400',
}

export function CustomerOrdersPage() {
  const { profile } = useOutletContext<{ profile: Profile }>()
  const [showForm, setShowForm] = useState(false)
  const { data: orders, isLoading } = useMyOrders(profile.id)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Мои заказы</h1>
          <p className="text-sm text-gray-500 mt-1">{orders?.length ? `${orders.length} заказ(ов)` : 'Опубликуйте первый заказ'}</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="w-4 h-4" /> Заказ
        </Button>
      </div>

      {isLoading && <Spinner className="mt-16" />}

      {!isLoading && orders?.length === 0 && (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-gray-700" />
          </div>
          <p className="text-gray-400 font-medium">Нет заказов</p>
          <p className="text-sm text-gray-600 mt-1">Нажмите «Заказ», чтобы найти строителя</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {orders?.map((order) => <OrderRow key={order.id} order={order} />)}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Новый заказ">
        <OrderForm onSuccess={() => setShowForm(false)} />
      </Modal>
    </div>
  )
}

function OrderRow({ order }: { order: Order }) {
  const navigate = useNavigate()
  const { data: candidates } = useOrderCandidates(order.id)
  const updateStatus = useUpdateOrderStatus()

  return (
    <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <span className="inline-block px-2 py-0.5 rounded-md bg-gray-800 text-xs text-gray-400 mb-1.5">{order.category}</span>
          <h3 className="font-semibold text-white truncate">{order.title}</h3>
        </div>
        <span className={`shrink-0 px-2 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
        {(order.budget_from || order.budget_to) && (
          <span className="flex items-center gap-1"><Wallet className="w-3 h-3" />
            {order.budget_from && order.budget_to ? `${order.budget_from}–${order.budget_to} ₽` : `${order.budget_from ?? order.budget_to} ₽`}
          </span>
        )}
        {order.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{order.city}</span>}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
        <button
          onClick={() => navigate(`/orders/${order.id}/candidates`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition-colors"
        >
          <Users2 className="w-4 h-4" />
          Отклики{candidates?.length ? ` (${candidates.length})` : ''}
        </button>

        {order.status === 'in_progress' && (
          <button
            onClick={() => updateStatus.mutate({ id: order.id, status: 'done' })}
            className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-sm font-medium transition-colors"
          >
            Завершить
          </button>
        )}
        {(order.status === 'active' || order.status === 'in_progress') && (
          <button
            onClick={() => updateStatus.mutate({ id: order.id, status: 'cancelled' })}
            className="px-3 py-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 text-sm font-medium transition-colors"
          >
            Отменить
          </button>
        )}
      </div>
    </div>
  )
}
