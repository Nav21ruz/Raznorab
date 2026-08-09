import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { BuilderProfile, Profile } from '../types/marketplace'

export function useMyProfile() {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      // К этому моменту сессию уже обеспечил AuthGate — профиль на сервере
      // создаётся автоматически при регистрации.
      const profile = await api.auth.me()
      if (!profile) throw new Error('Не авторизован')
      return profile
    },
    staleTime: Infinity,
    retry: 1,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<Pick<Profile, 'role' | 'first_name' | 'last_name' | 'phone' | 'city'>>) =>
      api.profiles.updateMe(patch),
    onSuccess: (data) => qc.setQueryData(['profile', 'me'], data),
  })
}

export function useProfileById(id: string | null | undefined) {
  return useQuery({
    queryKey: ['profile', id],
    queryFn: () => api.profiles.get(id as string),
    enabled: !!id,
  })
}

export function useBuilderProfile(id: string | null | undefined) {
  return useQuery({
    queryKey: ['builder_profile', id],
    queryFn: () => api.builderProfiles.get(id as string),
    enabled: !!id,
  })
}

export function useUpsertBuilderProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Omit<BuilderProfile, 'id'>) => api.builderProfiles.upsertMe(patch),
    onSuccess: (data) => qc.setQueryData(['builder_profile', data.id], data),
  })
}
