import { useState } from 'react'
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'
import { WEATHER_LABELS } from '../../types'

const workerSchema = z.object({
  name: z.string().min(1, 'Введите имя'),
  hours: z.coerce.number().int().min(1).max(24),
})

const schema = z.object({
  date: z.string().min(1, 'Выберите дату'),
  weather: z.string().min(1, 'Выберите погоду'),
  temperature: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z.number().nullable().optional(),
  ),
  work_description: z.string().min(1, 'Опишите выполненные работы'),
  notes: z.string().optional(),
  workers: z.array(workerSchema).optional(),
})

export type EntryFormData = z.infer<typeof schema>

interface Props {
  defaultValues?: Partial<EntryFormData>
  onSubmit: (data: EntryFormData) => Promise<void>
  submitLabel?: string
}

export function EntryForm({ defaultValues, onSubmit, submitLabel = 'Сохранить' }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<EntryFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      weather: 'sunny',
      workers: [],
      ...defaultValues,
    },
  })

  const { register, handleSubmit, control, formState: { errors } } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'workers' })

  const handleFormSubmit: SubmitHandler<EntryFormData> = async (data) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- resolver cast above (zod preprocess/coerce) makes RHF's inferred submit handler type mismatch
    <form onSubmit={handleSubmit(handleFormSubmit as any)} className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Дата" type="date" error={errors.date?.message} {...register('date')} />
        <Input label="Температура (°C)" type="number" placeholder="—" {...register('temperature')} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-400">Погода</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(WEATHER_LABELS).map(([key, label]) => (
            <label key={key} className="cursor-pointer">
              <input type="radio" value={key} {...register('weather')} className="sr-only peer" />
              <span className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-xl peer-checked:border-copper-500 peer-checked:bg-copper-500/10 peer-checked:text-copper-400 hover:border-gray-600 transition-all block">
                {label}
              </span>
            </label>
          ))}
        </div>
        {errors.weather && <p className="text-xs text-red-400">{errors.weather.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-400">Выполненные работы *</label>
        <textarea
          {...register('work_description')}
          className={`px-3 py-2.5 bg-gray-900 border rounded-xl text-sm text-gray-100 outline-none focus:ring-1 resize-none placeholder:text-gray-600 transition-all
            ${errors.work_description ? 'border-red-500 focus:border-red-400' : 'border-gray-700 focus:border-copper-500 focus:ring-copper-500/30'}`}
          rows={4}
          placeholder="Залита стяжка пола в комнате №1 и №2, площадь 28 м². Установлены маяки в коридоре..."
        />
        {errors.work_description && <p className="text-xs text-red-400">{errors.work_description.message}</p>}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-400">Рабочие</label>
          <Button type="button" variant="ghost" size="sm" onClick={() => append({ name: '', hours: 8 })}>
            <Plus className="w-4 h-4" /> Добавить
          </Button>
        </div>
        {fields.length === 0 && (
          <p className="text-sm text-gray-600 italic">Нет рабочих — нажмите «Добавить»</p>
        )}
        {fields.map((field, i) => (
          <div key={field.id} className="flex gap-2 items-start">
            <div className="flex-1">
              <Input placeholder="ФИО или имя" error={errors.workers?.[i]?.name?.message} {...register(`workers.${i}.name`)} />
            </div>
            <div className="w-24">
              <Input type="number" placeholder="Часы" min={1} max={24} error={errors.workers?.[i]?.hours?.message} {...register(`workers.${i}.hours`)} />
            </div>
            <button type="button" onClick={() => remove(i)} className="mt-2.5 p-2 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors text-gray-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-400">Заметки (необязательно)</label>
        <textarea
          {...register('notes')}
          className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-100 outline-none focus:border-copper-500 focus:ring-1 focus:ring-copper-500/30 resize-none placeholder:text-gray-600 transition-all"
          rows={2}
          placeholder="Задержка из-за поставки материалов. Завтра — продолжение работ..."
        />
      </div>

      <Button type="submit" loading={isSubmitting} className="w-full justify-center" size="lg">
        {submitLabel}
      </Button>
    </form>
  )
}
