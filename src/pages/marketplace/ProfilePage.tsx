import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { HardHat, Users, Wrench, Info } from 'lucide-react'
import { Input } from '../../components/shared/Input'
import { Button } from '../../components/shared/Button'
import { PhotoPicker } from '../../components/marketplace/PhotoPicker'
import { useBuilderProfile, useUpdateProfile, useUpsertBuilderProfile } from '../../hooks/useProfile'
import { useBannedWords } from '../../hooks/useModeration'
import { containsProfanity, maskProfanity } from '../../lib/profanity'
import { isMockBackend } from '../../lib/supabase'
import { BUILDER_CATEGORIES, ROLE_LABELS, type BuilderProfile, type Profile, type Role } from '../../types/marketplace'

const ROLE_ICONS: Record<Role, typeof Users> = { customer: Users, builder: HardHat, laborer: Wrench }

const schema = z.object({
  first_name: z.string().min(1, 'Введите имя'),
  city: z.string().min(1, 'Введите город'),
  phone: z.string().min(5, 'Введите телефон'),
})

type FormData = z.infer<typeof schema>

export function ProfilePage() {
  const { profile } = useOutletContext<{ profile: Profile }>()
  const updateProfile = useUpdateProfile()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { first_name: profile.first_name, city: profile.city ?? '', phone: profile.phone ?? '' },
  })

  const onSubmit = async (data: FormData) => {
    try {
      await updateProfile.mutateAsync(data)
      toast.success('Профиль обновлён')
    } catch {
      toast.error('Не удалось сохранить профиль')
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-2xl font-bold text-white mb-6">Профиль</h1>

      {isMockBackend && (
        <div className="flex items-start gap-2.5 p-3 mb-6 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs text-orange-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Демо-режим: данные хранятся только в этом браузере. Укажите VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY, чтобы подключить реальный Supabase.</span>
        </div>
      )}

      <div className="mb-6">
        <label className="text-sm font-medium text-gray-400 mb-2 block">Роль</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => {
            const Icon = ROLE_ICONS[r]
            const active = profile.role === r
            return (
              <button
                key={r}
                onClick={() => updateProfile.mutate(
                  { role: r },
                  {
                    onSuccess: () => toast.success(`Роль изменена: ${ROLE_LABELS[r]}`),
                    onError: () => toast.error('Не удалось изменить роль'),
                  },
                )}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all ${active ? 'bg-orange-500 border-orange-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'}`}
              >
                <Icon className="w-5 h-5" />
                {ROLE_LABELS[r]}
              </button>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mb-8">
        <Input label="Имя" error={errors.first_name?.message} {...register('first_name')} />
        <Input label="Город" error={errors.city?.message} {...register('city')} />
        <Input label="Телефон" error={errors.phone?.message} {...register('phone')} />
        <Button type="submit" loading={isSubmitting} className="w-full justify-center">Сохранить</Button>
      </form>

      {profile.role === 'builder' && <BuilderProfileSection builderId={profile.id} />}
    </div>
  )
}

const builderSchema = z.object({
  experience_years: z.string().optional(),
  price_from: z.string().optional(),
  price_to: z.string().optional(),
  about: z.string().optional(),
})

type BuilderFormData = z.infer<typeof builderSchema>

function BuilderProfileSection({ builderId }: { builderId: string }) {
  const { data: builderProfile, isLoading } = useBuilderProfile(builderId)
  if (isLoading) return null
  return <BuilderProfileForm builderId={builderId} builderProfile={builderProfile ?? null} />
}

function BuilderProfileForm({ builderId, builderProfile }: { builderId: string; builderProfile: BuilderProfile | null }) {
  const upsertBuilder = useUpsertBuilderProfile()
  const { data: bannedWords } = useBannedWords()
  const [specialties, setSpecialties] = useState<string[]>(builderProfile?.specialties ?? [])
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>(builderProfile?.portfolio_photos ?? [])

  const { register, handleSubmit } = useForm<BuilderFormData>({
    resolver: zodResolver(builderSchema),
    defaultValues: {
      experience_years: builderProfile?.experience_years?.toString() ?? '',
      price_from: builderProfile?.price_from?.toString() ?? '',
      price_to: builderProfile?.price_to?.toString() ?? '',
      about: builderProfile?.about ?? '',
    },
  })

  const onSubmit = async (data: BuilderFormData) => {
    if (specialties.length === 0) {
      toast.error('Выберите хотя бы одну специализацию')
      return
    }
    const patterns = (bannedWords ?? []).map((w) => w.pattern)
    const about = data.about ? maskProfanity(data.about, patterns) : data.about
    if (data.about && containsProfanity(data.about, patterns)) toast.warning('Нецензурная лексика скрыта звёздочками')

    try {
      await upsertBuilder.mutateAsync({
        specialties,
        experience_years: data.experience_years ? Number(data.experience_years) : null,
        price_from: data.price_from ? Number(data.price_from) : null,
        price_to: data.price_to ? Number(data.price_to) : null,
        about: about || null,
        portfolio_photos: portfolioPhotos,
        is_active: true,
      })
      toast.success('Профиль строителя обновлён')
    } catch {
      toast.error('Не удалось сохранить профиль строителя')
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Профиль строителя</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
          <label className="text-sm font-medium text-gray-400">О себе</label>
          <textarea
            {...register('about')}
            rows={3}
            className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-100 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 resize-none placeholder:text-gray-600 transition-all"
            placeholder="Расскажите о своём опыте и подходе к работе"
          />
        </div>

        <PhotoPicker photos={portfolioPhotos} onChange={setPortfolioPhotos} folder={`portfolio/${builderId}`} label="Портфолио (фото работ)" max={9} />

        <Button type="submit" loading={upsertBuilder.isPending} className="w-full justify-center">
          Сохранить профиль строителя
        </Button>
      </form>
    </div>
  )
}
