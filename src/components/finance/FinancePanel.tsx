import { useState } from 'react'
import { Trash2, Wallet, HandCoins, CheckCircle2, Circle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../shared/Button'
import { Modal } from '../shared/Modal'
import { ExpenseForm } from './ExpenseForm'
import { ShiftForm } from './ShiftForm'
import { useExpenses, useDeleteExpense } from '../../hooks/useExpenses'
import { useShifts, useDeleteShift, useTogglePaid } from '../../hooks/useShifts'
import { EXPENSE_CATEGORY_LABELS } from '../../types'

const formatMoney = (n: number) => `${n.toLocaleString('ru')} ₽`
const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'short' })

export function FinancePanel({ objectId }: { objectId: string }) {
  const { data: expenses } = useExpenses(objectId)
  const { data: shifts } = useShifts(objectId)
  const { mutateAsync: deleteExpense } = useDeleteExpense()
  const { mutateAsync: deleteShift } = useDeleteShift()
  const { mutateAsync: togglePaid } = useTogglePaid()
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showShiftForm, setShowShiftForm] = useState(false)

  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0
  const totalShifts = shifts?.reduce((sum, s) => sum + Number(s.amount), 0) ?? 0
  const unpaidShifts = shifts?.filter((s) => !s.paid).reduce((sum, s) => sum + Number(s.amount), 0) ?? 0

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-white">{formatMoney(totalExpenses)}</div>
          <div className="text-xs text-gray-500 mt-0.5">Расходы</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-white">{formatMoney(totalShifts)}</div>
          <div className="text-xs text-gray-500 mt-0.5">Смены</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-orange-400">{formatMoney(totalExpenses + totalShifts)}</div>
          <div className="text-xs text-gray-500 mt-0.5">Итого</div>
        </div>
      </div>

      {unpaidShifts > 0 && (
        <p className="text-xs text-amber-400/80 mb-4">Не выплачено рабочим: {formatMoney(unpaidShifts)}</p>
      )}

      <div className="flex gap-2 mb-5">
        <Button size="sm" variant="secondary" onClick={() => setShowExpenseForm(true)} className="flex-1 justify-center">
          <Wallet className="w-4 h-4" /> Расход
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setShowShiftForm(true)} className="flex-1 justify-center">
          <HandCoins className="w-4 h-4" /> Смена
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {expenses && expenses.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Расходы</h3>
            <div className="flex flex-col gap-1.5">
              {expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 shrink-0">{formatDate(e.date)}</span>
                      <span className="text-gray-300">{EXPENSE_CATEGORY_LABELS[e.category]}</span>
                    </div>
                    {e.description && <p className="text-xs text-gray-600 truncate mt-0.5">{e.description}</p>}
                  </div>
                  <span className="font-semibold text-gray-200 shrink-0">{formatMoney(Number(e.amount))}</span>
                  <button
                    onClick={async () => {
                      await deleteExpense({ id: e.id, objectId })
                      toast.success('Удалено')
                    }}
                    className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors text-gray-700 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {shifts && shifts.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Смены</h3>
            <div className="flex flex-col gap-1.5">
              {shifts.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5">
                  <button
                    onClick={() => togglePaid({ id: s.id, objectId, paid: !s.paid })}
                    title={s.paid ? 'Выплачено' : 'Отметить как выплачено'}
                    className="shrink-0"
                  >
                    {s.paid ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-gray-600" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 shrink-0">{formatDate(s.date)}</span>
                      <span className="text-gray-300 truncate">{s.worker_name}</span>
                    </div>
                    {s.hours != null && <p className="text-xs text-gray-600 mt-0.5">{s.hours} ч.</p>}
                  </div>
                  <span className="font-semibold text-gray-200 shrink-0">{formatMoney(Number(s.amount))}</span>
                  <button
                    onClick={async () => {
                      await deleteShift({ id: s.id, objectId })
                      toast.success('Удалено')
                    }}
                    className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors text-gray-700 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!expenses || expenses.length === 0) && (!shifts || shifts.length === 0) && (
          <div className="text-center py-10 text-gray-600">
            <p className="text-sm">Нет расходов и смен</p>
            <p className="text-xs mt-1">Добавьте вручную или через Telegram-бота</p>
          </div>
        )}
      </div>

      <Modal open={showExpenseForm} onClose={() => setShowExpenseForm(false)} title="Новый расход">
        <ExpenseForm objectId={objectId} onSuccess={() => setShowExpenseForm(false)} />
      </Modal>

      <Modal open={showShiftForm} onClose={() => setShowShiftForm(false)} title="Новая смена">
        <ShiftForm objectId={objectId} onSuccess={() => setShowShiftForm(false)} />
      </Modal>
    </div>
  )
}
