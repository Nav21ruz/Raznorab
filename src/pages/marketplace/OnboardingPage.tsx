import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { HardHat, Users, Wrench } from 'lucide-react'
import { Button } from '../../components/shared/Button'
import { Input } from '../../components/shared/Input'
import { useMyProfile, useUpdateProfile, useUpsertBuilderProfile } from '../../hooks/useProfile'
import { BUILDER_CATEGORIES, type Role } from '../../types/marketplace'

const ROLE_OPTIONS: { role: Role; title: string; description: string; icon: typeof Users }[] = [
  { role: 'customer', title: 'Я заказчик', description: 'Ищу строителей или разнорабочих для своих задач', icon: Users },
  { role: 'builder', title: 'Я строитель', description: 'Беру заказы на ремонт и строительство', icon: HardHat },
  { role: 'laborer', title: 'Я разнорабочий', description: 'Готов на подработки и разовые задачи', icon: Wrench },
]

const schema = z.object({
  first_name: z.string().min(1, 'Введите имя'),
  city: z.string().min(1, 'Введите город'),
  phone: z.string().min(5, 'Введите телефон, например +7 900 000-00-00'),
  experience_years: z.string().optional(),
  price_from: z.string().optional(),
  price_to: z.string().optional(),
  about: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function OnboardingPage() {
  const navigate = useNavigate()
  const { data: profile } = useMyProfile()
  const updateProfile = useUpdateProfile()
  const upsertBuilder = useUpsertBuilderProfile()
  const [role, setRole] = useState<Role | null>(null)
  const [specialties, setSpecialties] = useState<string[]>([])

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: profile?.first_name ?? '',
      city: profile?.city ?? '',
      phone: profile?.phone ?? '',
    },
  })

  useEffect(() => {
    if (profile) reset({ first_name: profile.first_name ?? '', city: profile.city ?? '', phone: profile.phone ?? '' })
  }, [profile, reset])

  if (!role) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col justify-center px-6 py-12">
        <div className="max-w-sm mx-auto w-full flex flex-col gap-4">
          <div className="text-center mb-3">
            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
              <HardHat className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Стройбиржа</h1>
            <p className="text-sm text-gray-500 mt-1">Кто вы?</p>
          </div>

          {ROLE_OPTIONS.map(({ role: r, title, description, icon: Icon }) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:border-orange-500/50 active:scale-[0.98] transition-all text-left"
            >
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="font-semibold text-white">{title}</p>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const onSubmit = async (data: FormData) => {
    if (role === 'builder' && specialties.length === 0) {
      toast.error('Выберите хотя бы одну специализацию')
      return
    }

    try {
      await updateProfile.mutateAsync({ role, first_name: data.first_name, city: data.city, phone: data.phone })

      if (role === 'builder') {
        await upsertBuilder.mutateAsync({
          specialties,
          experience_years: data.experience_years ? Number(data.experience_years) : null,
          price_from: data.price_from ? Number(data.price_from) : null,
          price_to: data.price_to ? Number(data.price_to) : null,
          about: data.about || null,
          portfolio_photos: [],
          is_active: true,
        })
      }
    } catch {
      toast.error('Не удалось сохранить профиль, попробуйте ещё раз')
      return
    }

    toast.success('Профиль готов!')
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-10">
      <div className="max-w-sm mx-auto flex flex-col gap-5">
        <button onClick={() => setRole(null)} className="text-sm text-gray-500 hover:text-gray-300 self-start">← Назад</button>
        <h1 className="text-xl font-bold text-white">Расскажите о себе</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Имя" placeholder="Как к вам обращаться" error={errors.first_name?.message} {...register('first_name')} />
          <Input label="Город" placeholder="Москва" error={errors.city?.message} {...register('city')} />
          <Input label="Телефон" placeholder="+7 900 000-00-00" error={errors.phone?.message} {...register('phone')} />

          {role === 'builder' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">Специализация</label>
                <div className="flex flex-wrap gap-2">
                  {BUILDER_CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setSpecialties((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat])}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${specialties.includes(cat) ? 'bg-orange-500 border-orange-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <Input label="Опыт работы, лет" type="number" min={0} {...register('experience_years')} />

              <div className="grid grid-cols-2 gap-3">
                <Input label="Цена от, ₽" type="number" min={0} {...register('price_from')} />
                <Input label="Цена до, ₽" type="number" min={0} {...register('price_to')} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-400">О себе (необязательно)</label>
                <textarea
                  {...register('about')}
                  rows={3}
                  className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-100 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 resize-none placeholder:text-gray-600 transition-all"
                  placeholder="Расскажите о своём опыте и подходе к работе"
                />
              </div>
            </>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full justify-center mt-2" size="lg">
            Готово
          </Button>
        </form>
      </div>
    </div>
  )
}
