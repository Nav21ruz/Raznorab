import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { ReportStatus, ReportTargetType } from '../types/marketplace'

export function useBannedWords() {
  return useQuery({
    queryKey: ['banned_words'],
    queryFn: () => api.moderation.bannedWords(),
    staleTime: 60_000,
  })
}

export function useIsAdmin(profileId: string | undefined) {
  return useQuery({
    queryKey: ['is_admin', profileId],
    queryFn: () => api.admin.check(),
    enabled: !!profileId,
  })
}

export function useMyBanStatus(profileId: string | undefined) {
  return useQuery({
    queryKey: ['my_ban_status', profileId],
    queryFn: () => api.moderation.myBanStatus(),
    enabled: !!profileId,
  })
}

export function useCreateReport() {
  return useMutation({
    mutationFn: (input: { targetType: ReportTargetType; targetId: string; reason: string; comment?: string }) =>
      api.reports.create(input),
  })
}

export function useAllReports() {
  return useQuery({
    queryKey: ['reports', 'all'],
    queryFn: () => api.admin.reports(),
  })
}

export function useUpdateReportStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReportStatus }) => api.admin.updateReportStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  })
}

export function useBanUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ profileId, reason }: { profileId: string; reason: string }) => api.admin.ban(profileId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my_ban_status'] })
      qc.invalidateQueries({ queryKey: ['banned_users'] })
    },
  })
}

export function useUnbanUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (profileId: string) => api.admin.unban(profileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my_ban_status'] })
      qc.invalidateQueries({ queryKey: ['banned_users'] })
    },
  })
}

export function useAllBannedUsers() {
  return useQuery({
    queryKey: ['banned_users', 'all'],
    queryFn: () => api.admin.bannedUsers(),
  })
}

export function useAddBannedWord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pattern: string) => api.admin.addWord(pattern),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banned_words'] }),
  })
}

export function useDeleteBannedWord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.admin.deleteWord(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banned_words'] }),
  })
}

// Поиск теперь выполняется на сервере (ilike + триграммные индексы), а не в браузере.
export function useSearchProfiles(query: string) {
  return useQuery({
    queryKey: ['admin_search_profiles', query],
    queryFn: () => api.admin.users(query),
  })
}

export function useAdminCounts() {
  return useQuery({
    queryKey: ['admin_counts'],
    queryFn: () => api.admin.counts(),
  })
}
