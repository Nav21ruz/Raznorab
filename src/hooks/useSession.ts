import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { onAuthChange } from '../lib/authEvents'
import type { Profile } from '../types/marketplace'

/** undefined — ещё проверяем, null — не авторизован */
export function useSession(): Profile | null | undefined {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined)

  useEffect(() => {
    let active = true
    const refresh = () => {
      api.auth.me()
        .then((p) => { if (active) setProfile(p) })
        .catch(() => {
          // Сетевой сбой или сервер временно недоступен (api.auth.me бросает исключение
          // только в этом случае — настоящую невалидность токена он гасит сам и просто
          // возвращает null). Не сбрасываем состояние — пусть человек останется как был,
          // а не увидит внезапный выход из аккаунта из-за случайного обрыва связи.
        })
    }
    refresh()
    const unsubscribe = onAuthChange(refresh)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return profile
}
