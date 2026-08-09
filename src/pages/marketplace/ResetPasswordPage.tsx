import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Handshake } from 'lucide-react'
import { api } from '../../lib/api'
import { Input } from '../../components/shared/Input'
import { Button } from '../../components/shared/Button'

const schema = z
  .object({
    password: z.string().min(6, 'Минимум 6 символов'),
    confirm: z.string().min(6, 'Минимум 6 символов'),
  })
  .refine((data) => data.password === data.confirm, { message: 'Пароли не совпадают', path: ['confirm'] })

type FormData = z.infer<typeof schema>

/** Страница по ссылке из письма "Забыли пароль?" (/auth/reset-password?token=...) */
export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const [done, setDone] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await api.auth.resetPassword(token, data.password)
      setDone(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось сбросить пароль')
    }
  }

  return (
    <div className="min-h-dvh bg-bg-page flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 bg-copper-500 rounded-2xl flex items-center justify-center shadow-lg shadow-copper-500/30">
            <Handshake className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Briggo</h1>
        </div>

        <div className="bg-bg-card border border-border-1 rounded-2xl p-6 shadow-2xl">
          {!token ? (
            <div className="text-center py-2">
              <p className="text-sm text-error-text">Некорректная ссылка для сброса пароля.</p>
              <button onClick={() => navigate('/', { replace: true })} className="text-sm text-copper-hover hover:underline mt-4">
                Вернуться на главную
              </button>
            </div>
          ) : done ? (
            <div className="text-center py-2">
              <p className="text-sm text-text-secondary">Пароль изменён. Теперь можно войти с новым паролем.</p>
              <Button type="button" onClick={() => navigate('/auth', { replace: true })} className="w-full justify-center mt-5">
                Войти
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <p className="text-sm text-text-secondary">Придумайте новый пароль.</p>
              <Input label="Новый пароль" type="password" autoComplete="new-password" placeholder="••••••" error={errors.password?.message} {...register('password')} />
              <Input label="Повторите пароль" type="password" autoComplete="new-password" placeholder="••••••" error={errors.confirm?.message} {...register('confirm')} />
              <Button type="submit" loading={isSubmitting} className="w-full justify-center mt-2" size="lg">
                Сохранить пароль
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
