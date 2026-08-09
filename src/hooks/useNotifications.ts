import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useNotificationsSummary(myId: string | undefined) {
  return useQuery({
    queryKey: ['notifications', 'summary', myId],
    queryFn: () => api.notifications.summary(),
    enabled: !!myId,
    // значки в нижней навигации — опрос пореже, чем сам чат, отдельного
    // экрана под это нет, крутится на любом экране приложения
    refetchInterval: 15000,
  })
}
