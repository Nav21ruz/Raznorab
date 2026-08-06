import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { HardHat, Info } from 'lucide-react'
import { api, isMockBackend } from '../../lib/api'
import { Input } from '../../components/shared/Input'
import { Button } from '../../components/shared/Button'

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
})

type FormData = z.infer<typeof schema>

export function WebAuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    const email = data.email.trim()
    try {
      if (mode === 'login') {
        await api.auth.login(email, data.password)
      } else {
        await api.auth.register(email, data.password)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось выполнить вход')
    }
  }

  return (
    <div className="min-h-dvh bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <HardHat className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Стройбиржа</h1>
          <p className="text-sm text-gray-500 text-center">Заказы на стройку и разовые подработки</p>
        </div>

        {isMockBackend && (
          <div className="flex items-start gap-2.5 p-3 mb-5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs text-orange-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Демо-режим: аккаунты хранятся только в этом браузере. Можно зарегистрировать любой email.</span>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex rounded-xl bg-gray-800 p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all ${mode === 'login' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Войти
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all ${mode === 'register' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Email" type="email" autoComplete="email" placeholder="master@example.com" error={errors.email?.message} {...register('email')} />
            <Input
              label="Пароль"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" loading={isSubmitting} className="w-full justify-center mt-2" size="lg">
              {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </Button>
          </form>
        </div>

        <p className="text-xs text-gray-600 text-center mt-6">
          Открыв приложение внутри Telegram, входить не нужно — вход произойдёт автоматически.
        </p>
      </div>
    </div>
  )
}
