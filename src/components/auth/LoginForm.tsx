import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'
import { HardHat } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
})

type FormData = z.infer<typeof schema>

export function LoginForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword(data)
      if (error) setError('Неверный email или пароль')
    } else {
      const { error } = await supabase.auth.signUp(data)
      if (error) setError(error.message)
      else setError('Проверьте почту — мы отправили ссылку для подтверждения')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
            <HardHat className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Журнал объекта</h1>
          <p className="text-sm text-gray-500 text-center">Документация для прораба и строительной бригады</p>
        </div>

        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${mode === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            Войти
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${mode === 'register' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Email" type="email" placeholder="prrab@example.com" error={errors.email?.message} {...register('email')} />
          <Input label="Пароль" type="password" placeholder="••••••" error={errors.password?.message} {...register('password')} />

          {error && (
            <p className={`text-sm p-3 rounded-lg ${error.includes('Проверьте') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {error}
            </p>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full justify-center mt-2">
            {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </Button>
        </form>
      </div>
    </div>
  )
}
