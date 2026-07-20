import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { TelegramLink, TelegramLinkCode } from '../types'

function generateCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(5))
  return Array.from(bytes, (b) => (b % 36).toString(36)).join('').toUpperCase()
}

export function useTelegramLink() {
  return useQuery({
    queryKey: ['telegram-link'],
    queryFn: async () => {
      const { data, error } = await supabase.from('telegram_links').select('*').maybeSingle()
      if (error) throw error
      return data as TelegramLink | null
    },
  })
}

export function useCreateLinkCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const code = generateCode()
      const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString()
      const { data, error } = await supabase
        .from('telegram_link_codes')
        .insert({ code, user_id: user!.id, expires_at })
        .select()
        .single()
      if (error) throw error
      return data as TelegramLinkCode
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['telegram-link'] }),
  })
}

export function useUnlinkTelegram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('telegram_links').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['telegram-link'] }),
  })
}
