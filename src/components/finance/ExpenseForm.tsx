import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'
import { useCreateExpense } from '../../hooks/useExpenses'
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '../../types'

const schema = z.object({
  date: z.string().min(1, 'Выберите дату'),
  amount: z.coerce.number().positive('Введите сумму'),
  category: z.string().min(1),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  objectId: string
  onSuccess: () => void
}

export function ExpenseForm({ objectId, onSuccess }: Props) {
  const { mutateAsync, isPending } = useCreateExpense()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { date: new Date().toISOString().split('T')[0], category: 'materials' },
  })

  const onSubmit = async (data: FormData) => {
    await mutateAsync({
      object_id: objectId,
      date: data.date,
      amount: data.amount,
      category: data.category as ExpenseCategory,
      description: data.description || null,
    })
    toast.success('Расход добавлен')
    onSuccess()
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Дата" type="date" error={errors.date?.message} {...register('date')} />
        <Input label="Сумма, ₽" type="number" step="0.01" placeholder="4500" error={errors.amount?.message} {...register('amount')} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-400">Категория</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => (
            <label key={key} className="cursor-pointer">
              <input type="radio" value={key} {...register('category')} className="sr-only peer" />
              <span className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-xl peer-checked:border-orange-500 peer-checked:bg-orange-500/10 peer-checked:text-orange-400 hover:border-gray-600 transition-all block">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-400">Описание (необязательно)</label>
        <textarea
          {...register('description')}
          className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-100 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 resize-none placeholder:text-gray-600 transition-all"
          rows={2}
          placeholder="Цемент 5 мешков, доставка"
        />
      </div>

      <Button type="submit" loading={isPending} className="w-full justify-center mt-2">
        Добавить расход
      </Button>
    </form>
  )
}
