import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { BannedUser, BannedWord, Profile, Report, ReportTargetType } from '../types/marketplace'

export function useBannedWords() {
  return useQuery({
    queryKey: ['banned_words'],
    queryFn: async () => {
      const { data, error } = await supabase.from('banned_words').select('*').order('created_at', { ascending: true })
      if (error) throw error
      return data as BannedWord[]
    },
    staleTime: 60_000,
  })
}

export function useIsAdmin(profileId: string | undefined) {
  return useQuery({
    queryKey: ['is_admin', profileId],
    queryFn: async () => {
      const { data, error } = await supabase.from('admins').select('profile_id').eq('profile_id', profileId as string).maybeSingle()
      if (error) throw error
      return !!data
    },
    enabled: !!profileId,
  })
}

export function useMyBanStatus(profileId: string | undefined) {
  return useQuery({
    queryKey: ['my_ban_status', profileId],
    queryFn: async () => {
      const { data, error } = await supabase.from('banned_users').select('*').eq('profile_id', profileId as string).maybeSingle()
      if (error) throw error
      return data as BannedUser | null
    },
    enabled: !!profileId,
  })
}

export function useCreateReport() {
  return useMutation({
    mutationFn: async (input: { targetType: ReportTargetType; targetId: string; reason: string; comment?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user!.id,
          target_type: input.targetType,
          target_id: input.targetId,
          reason: input.reason,
          comment: input.comment || null,
          status: 'pending',
        })
        .select()
        .single()
      if (error) throw error
      return data as Report
    },
  })
}

export function useAllReports() {
  return useQuery({
    queryKey: ['reports', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Report[]
    },
  })
}

export function useUpdateReportStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Report['status'] }) => {
      const { error } = await supabase.from('reports').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  })
}

export function useBanUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ profileId, reason }: { profileId: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('banned_users').insert({
        profile_id: profileId,
        reason,
        banned_by: user!.id,
        banned_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my_ban_status'] }),
  })
}

export function useUnbanUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase.from('banned_users').delete().eq('profile_id', profileId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my_ban_status'] }),
  })
}

export function useAllBannedUsers() {
  return useQuery({
    queryKey: ['banned_users', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('banned_users').select('*').order('banned_at', { ascending: false })
      if (error) throw error
      return data as BannedUser[]
    },
  })
}

export function useAddBannedWord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (pattern: string) => {
      const { error } = await supabase.from('banned_words').insert({ pattern })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banned_words'] }),
  })
}

export function useDeleteBannedWord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('banned_words').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banned_words'] }),
  })
}

// Простой клиентский поиск (без ilike — работает одинаково с моком и реальным Supabase)
export function useSearchProfiles(query: string) {
  return useQuery({
    queryKey: ['admin_search_profiles', query],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (error) throw error
      const rows = data as Profile[]
      const q = query.trim().toLowerCase()
      if (!q) return rows.slice(0, 50)
      return rows.filter((p) =>
        p.first_name?.toLowerCase().includes(q)
        || p.last_name?.toLowerCase().includes(q)
        || p.telegram_username?.toLowerCase().includes(q)
        || p.phone?.toLowerCase().includes(q)
        || p.city?.toLowerCase().includes(q),
      )
    },
  })
}

export function useAdminCounts() {
  return useQuery({
    queryKey: ['admin_counts'],
    queryFn: async () => {
      const [profiles, orders, laborTasks, pendingReports, bannedUsers] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('labor_tasks').select('*'),
        supabase.from('reports').select('*').eq('status', 'pending'),
        supabase.from('banned_users').select('*'),
      ])
      return {
        profiles: profiles.data?.length ?? 0,
        orders: orders.data?.length ?? 0,
        laborTasks: laborTasks.data?.length ?? 0,
        pendingReports: pendingReports.data?.length ?? 0,
        bannedUsers: bannedUsers.data?.length ?? 0,
      }
    },
  })
}
