import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
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
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword(data)
      if (error) toast.error('Неверный email или пароль')
    } else {
      const { error } = await supabase.auth.signUp(data)
      if (error) toast.error(error.message)
      else toast.success('Аккаунт создан! Проверьте почту для подтверждения.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <HardHat className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Журнал объекта</h1>
          <p className="text-sm text-gray-500 text-center">Документация строительства для прораба</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex rounded-xl bg-gray-800 p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all ${mode === 'login' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Войти
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all ${mode === 'register' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Email" type="email" placeholder="prrab@example.com" error={errors.email?.message} {...register('email')} />
            <Input label="Пароль" type="password" placeholder="••••••" error={errors.password?.message} {...register('password')} />
            <Button type="submit" loading={isSubmitting} className="w-full justify-center mt-2" size="lg">
              {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
