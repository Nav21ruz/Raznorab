import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'
import { useCreateShift } from '../../hooks/useShifts'

const schema = z.object({
  worker_name: z.string().min(1, 'Введите имя'),
  date: z.string().min(1, 'Выберите дату'),
  amount: z.coerce.number().min(0, 'Введите сумму'),
  hours: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z.number().nullable().optional(),
  ),
  paid: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  objectId: string
  onSuccess: () => void
}

export function ShiftForm({ objectId, onSuccess }: Props) {
  const { mutateAsync, isPending } = useCreateShift()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { date: new Date().toISOString().split('T')[0], paid: false },
  })

  const onSubmit = async (data: FormData) => {
    await mutateAsync({
      object_id: objectId,
      worker_name: data.worker_name,
      date: data.date,
      amount: data.amount,
      hours: data.hours ?? null,
      paid: data.paid ?? false,
      notes: null,
    })
    toast.success('Смена добавлена')
    onSuccess()
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col gap-4">
      <Input label="Имя рабочего" placeholder="Иван" error={errors.worker_name?.message} {...register('worker_name')} />

      <div className="grid grid-cols-3 gap-4">
        <Input label="Дата" type="date" error={errors.date?.message} {...register('date')} />
        <Input label="Сумма, ₽" type="number" step="0.01" placeholder="2500" error={errors.amount?.message} {...register('amount')} />
        <Input label="Часы (необязательно)" type="number" step="0.5" placeholder="8" {...register('hours')} />
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-400">
        <input type="checkbox" {...register('paid')} className="w-4 h-4 rounded accent-orange-500" />
        Уже выплачено
      </label>

      <Button type="submit" loading={isPending} className="w-full justify-center mt-2">
        Добавить смену
      </Button>
    </form>
  )
}
