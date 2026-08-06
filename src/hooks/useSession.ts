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
      api.auth.me().then((p) => { if (active) setProfile(p) })
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
