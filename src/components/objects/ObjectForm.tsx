import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'
import { useCreateObject } from '../../hooks/useObjects'

const schema = z.object({
  name: z.string().min(1, 'Введите название'),
  address: z.string().min(1, 'Введите адрес'),
  start_date: z.string().min(1, 'Выберите дату начала'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  onSuccess: () => void
}

export function ObjectForm({ onSuccess }: Props) {
  const { mutateAsync, isPending } = useCreateObject()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { start_date: new Date().toISOString().split('T')[0] },
  })

  const onSubmit = async (data: FormData) => {
    await mutateAsync({ ...data, description: data.description || null })
    toast.success('Объект создан')
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Название объекта" placeholder="ЖК Лесной, кв. 45" error={errors.name?.message} {...register('name')} />
      <Input label="Адрес" placeholder="г. Москва, ул. Ленина, 1" error={errors.address?.message} {...register('address')} />
      <Input label="Дата начала" type="date" error={errors.start_date?.message} {...register('start_date')} />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-400">Описание (необязательно)</label>
        <textarea
          {...register('description')}
          className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 resize-none placeholder:text-gray-600 transition-all"
          rows={3}
          placeholder="Ремонт под ключ, двухкомнатная квартира, 62 м²"
        />
      </div>
      <Button type="submit" loading={isPending} className="w-full justify-center mt-2">
        Создать объект
      </Button>
    </form>
  )
}
