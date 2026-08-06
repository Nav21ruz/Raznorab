import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { Spinner } from '../../components/shared/Spinner'

/** Страница, на которую Яндекс возвращает пользователя после входа (redirect_uri) */
export function YandexCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const run = async () => {
      const code = params.get('code')
      const state = params.get('state')
      if (params.get('error')) throw new Error('Вход через Яндекс отменён')
      if (!code || !state) throw new Error('Некорректный ответ от Яндекса — попробуйте войти ещё раз')
      await api.auth.yandex(code, state)
      navigate('/', { replace: true })
    }

    run().catch((e) => setError(e instanceof Error ? e.message : 'Не удалось войти через Яндекс'))
  }, [params, navigate])

  return (
    <div className="min-h-dvh bg-gray-950 flex items-center justify-center p-4">
      {error ? (
        <div className="max-w-xs text-center">
          <p className="text-sm text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate('/', { replace: true })} className="text-sm text-orange-400 hover:underline">
            Вернуться на главную
          </button>
        </div>
      ) : (
        <Spinner />
      )}
    </div>
  )
}
