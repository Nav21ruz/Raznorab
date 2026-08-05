import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getTelegramUser } from '../lib/telegram'
import type { BuilderProfile, Profile } from '../types/marketplace'

async function fetchOrCreateProfile(): Promise<Profile> {
  const { data: { session: existingSession } } = await supabase.auth.getSession()
  let session = existingSession

  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    session = data.session
  }

  const uid = session!.user.id

  const { data: existing, error: fetchErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle()
  if (fetchErr) throw fetchErr
  if (existing) return existing as Profile

  const tgUser = getTelegramUser()
  const { data: created, error: insertErr } = await supabase
    .from('profiles')
    .insert({
      id: uid,
      telegram_id: tgUser?.id ?? null,
      telegram_username: tgUser?.username ?? null,
      first_name: tgUser?.first_name ?? 'Пользователь',
      last_name: tgUser?.last_name ?? null,
      photo_url: tgUser?.photo_url ?? null,
    })
    .select()
    .single()

  if (insertErr) {
    // Скорее всего конфликт unique(telegram_id) — сессия потерялась, но профиль для
    // этого telegram-аккаунта уже существует. Показываем его в режиме чтения.
    if (tgUser?.id) {
      const { data: byTelegram } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_id', tgUser.id)
        .maybeSingle()
      if (byTelegram) return byTelegram as Profile
    }
    throw insertErr
  }

  return created as Profile
}

export function useMyProfile() {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: fetchOrCreateProfile,
    staleTime: Infinity,
    retry: 1,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Pick<Profile, 'role' | 'first_name' | 'last_name' | 'phone' | 'city'>>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', user!.id)
        .select()
        .single()
      if (error) throw error
      return data as Profile
    },
    onSuccess: (data) => qc.setQueryData(['profile', 'me'], data),
  })
}

export function useProfileById(id: string | null | undefined) {
  return useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
      if (error) throw error
      return data as Profile
    },
    enabled: !!id,
  })
}

export function useBuilderProfile(id: string | null | undefined) {
  return useQuery({
    queryKey: ['builder_profile', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('builder_profiles').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      return data as BuilderProfile | null
    },
    enabled: !!id,
  })
}

export function useUpsertBuilderProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Omit<BuilderProfile, 'id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('builder_profiles')
        .upsert({ id: user!.id, ...patch })
        .select()
        .single()
      if (error) throw error
      return data as BuilderProfile
    },
    onSuccess: (data) => qc.setQueryData(['builder_profile', data.id], data),
  })
}
