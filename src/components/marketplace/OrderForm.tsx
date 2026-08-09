import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'
import { PhotoPicker } from './PhotoPicker'
import { useCreateOrder } from '../../hooks/useOrders'
import { useBannedWords } from '../../hooks/useModeration'
import { containsProfanity, maskProfanity } from '../../lib/profanity'
import { BUILDER_CATEGORIES } from '../../types/marketplace'

const schema = z.object({
  category: z.string().min(1, 'Выберите категорию'),
  title: z.string().min(1, 'Введите название'),
  description: z.string().min(1, 'Опишите задачу'),
  budget_from: z.string().optional(),
  budget_to: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function OrderForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutateAsync, isPending } = useCreateOrder()
  const { data: bannedWords } = useBannedWords()
  const [photos, setPhotos] = useState<string[]>([])
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    const patterns = (bannedWords ?? []).map((w) => w.pattern)
    const hasProfanity = containsProfanity(data.title, patterns) || containsProfanity(data.description, patterns)
    const title = maskProfanity(data.title, patterns)
    const description = maskProfanity(data.description, patterns)
    if (hasProfanity) toast.warning('Нецензурная лексика скрыта звёздочками')

    try {
      await mutateAsync({
        category: data.category,
        title,
        description,
        budget_from: data.budget_from ? Number(data.budget_from) : null,
        budget_to: data.budget_to ? Number(data.budget_to) : null,
        city: data.city || null,
        address: data.address || null,
        photos,
      })
      toast.success('Заказ опубликован')
      onSuccess()
    } catch {
      toast.error('Не удалось опубликовать заказ')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Категория</label>
        <select
          {...register('category')}
          defaultValue=""
          className="px-3 py-2.5 bg-bg-card border border-border-2 rounded-xl text-sm text-text-primary outline-none focus:border-copper-500 focus:ring-1 focus:ring-copper-500/30"
        >
          <option value="" disabled>Выберите категорию</option>
          {BUILDER_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors.category && <p className="text-xs text-error-text">{errors.category.message}</p>}
      </div>

      <Input label="Название заказа" placeholder="Укладка плитки в ванной" error={errors.title?.message} {...register('title')} />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Описание</label>
        <textarea
          {...register('description')}
          rows={4}
          className="px-3 py-2.5 bg-bg-card border border-border-2 rounded-xl text-sm text-text-primary outline-none focus:border-copper-500 focus:ring-1 focus:ring-copper-500/30 resize-none placeholder:text-text-muted transition-all"
          placeholder="Опишите объём работ, сроки, материалы"
        />
        {errors.description && <p className="text-xs text-error-text">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Бюджет от, ₽" type="number" min={0} {...register('budget_from')} />
        <Input label="Бюджет до, ₽" type="number" min={0} {...register('budget_to')} />
      </div>

      <Input label="Город" placeholder="Москва" {...register('city')} />
      <Input label="Адрес / район (необязательно)" placeholder="м. Тульская" {...register('address')} />

      <PhotoPicker photos={photos} onChange={setPhotos} folder="orders" />

      <Button type="submit" loading={isPending} className="w-full justify-center mt-2">
        Опубликовать заказ
      </Button>
    </form>
  )
}
