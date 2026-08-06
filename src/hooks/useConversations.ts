import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useMyConversations(myId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', myId],
    queryFn: () => api.conversations.list(),
    enabled: !!myId,
    // realtime заменили на периодический опрос (см. решение о переходе на РФ-хостинг
    // без постоянного сервера для WebSocket) — список чатов и последнее сообщение
    // подтягиваются каждые несколько секунд, а не мгновенно
    refetchInterval: 5000,
  })
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => api.conversations.get(id as string),
    enabled: !!id,
  })
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => api.conversations.messages(conversationId as string),
    enabled: !!conversationId,
    refetchInterval: 3000,
  })
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (text: string) => api.conversations.sendMessage(conversationId, text),
    onSuccess: (msg) => {
      qc.setQueryData(['messages', conversationId], (old: typeof msg[] | undefined) => {
        if (old?.some((m) => m.id === msg.id)) return old
        return [...(old ?? []), msg]
      })
    },
  })
}
