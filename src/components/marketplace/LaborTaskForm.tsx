import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'
import { useCreateLaborTask } from '../../hooks/useLabor'
import { useBannedWords } from '../../hooks/useModeration'
import { containsProfanity, maskProfanity } from '../../lib/profanity'
import { PAY_TYPE_LABELS, type PayType } from '../../types/marketplace'

const schema = z.object({
  title: z.string().min(1, 'Введите название задачи'),
  description: z.string().min(1, 'Опишите задачу'),
  city: z.string().optional(),
  pay_amount: z.string().optional(),
  pay_type: z.enum(['per_task', 'per_day', 'per_hour']),
  date_needed: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function LaborTaskForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutateAsync, isPending } = useCreateLaborTask()
  const { data: bannedWords } = useBannedWords()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { pay_type: 'per_task' },
  })

  const onSubmit = async (data: FormData) => {
    const patterns = (bannedWords ?? []).map((w) => w.pattern)
    const hasProfanity = containsProfanity(data.title, patterns) || containsProfanity(data.description, patterns)
    const title = maskProfanity(data.title, patterns)
    const description = maskProfanity(data.description, patterns)
    if (hasProfanity) toast.warning('Нецензурная лексика скрыта звёздочками')

    try {
      await mutateAsync({
        title,
        description,
        city: data.city || null,
        pay_amount: data.pay_amount ? Number(data.pay_amount) : null,
        pay_type: data.pay_type,
        date_needed: data.date_needed || null,
      })
      toast.success('Задача опубликована')
      onSuccess()
    } catch {
      toast.error('Не удалось опубликовать задачу')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Название задачи" placeholder="Разгрузить машину с кирпичом" error={errors.title?.message} {...register('title')} />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-400">Описание</label>
        <textarea
          {...register('description')}
          rows={3}
          className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-100 outline-none focus:border-copper-500 focus:ring-1 focus:ring-copper-500/30 resize-none placeholder:text-gray-600 transition-all"
          placeholder="Что нужно сделать, сколько человек, на сколько времени"
        />
        {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Оплата, ₽" type="number" min={0} placeholder="3000" {...register('pay_amount')} />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-400">Тип оплаты</label>
          <select
            {...register('pay_type')}
            className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-100 outline-none focus:border-copper-500 focus:ring-1 focus:ring-copper-500/30"
          >
            {(Object.keys(PAY_TYPE_LABELS) as PayType[]).map((pt) => (
              <option key={pt} value={pt}>{PAY_TYPE_LABELS[pt]}</option>
            ))}
          </select>
        </div>
      </div>

      <Input label="Город" placeholder="Москва" {...register('city')} />
      <Input label="Когда нужно (необязательно)" type="date" {...register('date_needed')} />

      <Button type="submit" loading={isPending} className="w-full justify-center mt-2">
        Опубликовать задачу
      </Button>
    </form>
  )
}
