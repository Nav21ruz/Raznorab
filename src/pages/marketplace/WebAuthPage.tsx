import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { HardHat, Info } from 'lucide-react'
import { api, isMockBackend, yandexLoginAvailable } from '../../lib/api'
import { Input } from '../../components/shared/Input'
import { Button } from '../../components/shared/Button'

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
})

type FormData = z.infer<typeof schema>

export function WebAuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [agreed, setAgreed] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (mode === 'register' && !agreed) {
      toast.error('Нужно принять условия использования и политику конфиденциальности')
      return
    }
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
            {mode === 'register' && (
              <label className="flex items-start gap-2.5 text-xs text-gray-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 shrink-0 rounded border-gray-700 bg-gray-800 accent-orange-500"
                />
                <span>
                  Я принимаю{' '}
                  <Link to="/terms" target="_blank" className="text-orange-400 hover:underline">Пользовательское соглашение</Link>
                  {' '}и{' '}
                  <Link to="/privacy" target="_blank" className="text-orange-400 hover:underline">Политику конфиденциальности</Link>
                </span>
              </label>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full justify-center mt-2" size="lg">
              {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </Button>
          </form>

          {yandexLoginAvailable && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="h-px bg-gray-800 flex-1" />
                <span className="text-xs text-gray-600">или</span>
                <div className="h-px bg-gray-800 flex-1" />
              </div>
              <button
                type="button"
                onClick={() => { window.location.href = api.auth.buildYandexAuthorizeUrl() }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-gray-900 font-medium text-sm hover:bg-gray-100 transition-colors"
              >
                <span className="w-5 h-5 rounded-full bg-[#fc3f1d] text-white flex items-center justify-center text-xs font-bold shrink-0">Я</span>
                Войти через Яндекс
              </button>
              <p className="text-xs text-gray-600 text-center mt-3">
                Продолжая, вы принимаете{' '}
                <Link to="/terms" target="_blank" className="hover:text-gray-400 underline">условия</Link>
                {' '}и{' '}
                <Link to="/privacy" target="_blank" className="hover:text-gray-400 underline">политику конфиденциальности</Link>
              </p>
            </>
          )}
        </div>

        <p className="text-xs text-gray-600 text-center mt-6">
          Открыв приложение внутри Telegram, входить не нужно — вход произойдёт автоматически.
        </p>
        <p className="text-xs text-gray-700 text-center mt-2">
          <Link to="/terms" className="hover:text-gray-500">Пользовательское соглашение</Link>
          {' · '}
          <Link to="/privacy" className="hover:text-gray-500">Политика конфиденциальности</Link>
        </p>
      </div>
    </div>
  )
}
