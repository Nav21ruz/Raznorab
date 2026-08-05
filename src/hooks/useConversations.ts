import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Conversation, ConversationKind, LaborTask, Message, Order, Profile } from '../types/marketplace'

export function useCreateConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { kind: ConversationKind; orderId?: string; laborTaskId?: string; workerId: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          kind: input.kind,
          order_id: input.orderId ?? null,
          labor_task_id: input.laborTaskId ?? null,
          customer_id: user!.id,
          worker_id: input.workerId,
        })
        .select()
        .single()
      if (error) throw error
      return data as Conversation
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  })
}

export interface ConversationWithPeer extends Conversation {
  peerName: string
  peerPhoto: string | null
  contextTitle: string
  lastMessage?: string
  lastMessageAt?: string
}

export function useMyConversations(myId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', myId],
    queryFn: async () => {
      const { data: asCustomer, error: e1 } = await supabase.from('conversations').select('*').eq('customer_id', myId as string)
      if (e1) throw e1
      const { data: asWorker, error: e2 } = await supabase.from('conversations').select('*').eq('worker_id', myId as string)
      if (e2) throw e2
      const all = [...(asCustomer as Conversation[]), ...(asWorker as Conversation[])]
      if (all.length === 0) return []

      const peerIds = all.map((c) => (c.customer_id === myId ? c.worker_id : c.customer_id))
      const { data: peers } = await supabase.from('profiles').select('*').in('id', peerIds)
      const peerMap = new Map(((peers ?? []) as Profile[]).map((p) => [p.id, p]))

      const orderIds = all.filter((c) => c.order_id).map((c) => c.order_id as string)
      const laborIds = all.filter((c) => c.labor_task_id).map((c) => c.labor_task_id as string)
      const { data: orders } = orderIds.length ? await supabase.from('orders').select('*').in('id', orderIds) : { data: [] as Order[] }
      const { data: laborTasks } = laborIds.length ? await supabase.from('labor_tasks').select('*').in('id', laborIds) : { data: [] as LaborTask[] }
      const orderMap = new Map(((orders ?? []) as Order[]).map((o) => [o.id, o]))
      const laborMap = new Map(((laborTasks ?? []) as LaborTask[]).map((t) => [t.id, t]))

      const { data: lastMessages } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', all.map((c) => c.id))
        .order('created_at', { ascending: false })
      const lastByConv = new Map<string, Message>()
      for (const m of ((lastMessages ?? []) as Message[])) {
        if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m)
      }

      return all
        .map((c): ConversationWithPeer => {
          const peerId = c.customer_id === myId ? c.worker_id : c.customer_id
          const peer = peerMap.get(peerId)
          const contextTitle = (c.kind === 'order' ? orderMap.get(c.order_id!)?.title : laborMap.get(c.labor_task_id!)?.title) ?? '—'
          const last = lastByConv.get(c.id)
          return {
            ...c,
            peerName: peer ? `${peer.first_name} ${peer.last_name ?? ''}`.trim() : 'Пользователь',
            peerPhoto: peer?.photo_url ?? null,
            contextTitle,
            lastMessage: last?.text,
            lastMessageAt: last?.created_at,
          }
        })
        .sort((a, b) => new Date(b.lastMessageAt ?? b.created_at).getTime() - new Date(a.lastMessageAt ?? a.created_at).getTime())
    },
    enabled: !!myId,
  })
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('conversations').select('*').eq('id', id as string).single()
      if (error) throw error
      return data as Conversation
    },
    enabled: !!id,
  })
}

export function useMessages(conversationId: string | undefined) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!conversationId) return
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload: { new: Message }) => {
          qc.setQueryData(['messages', conversationId], (old: Message[] | undefined) => {
            const incoming = payload.new
            if (old?.some((m) => m.id === incoming.id)) return old
            return [...(old ?? []), incoming]
          })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId, qc])

  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId as string)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Message[]
    },
    enabled: !!conversationId,
  })
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (text: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: user!.id, text })
        .select()
        .single()
      if (error) throw error
      return data as Message
    },
    onSuccess: (msg) => {
      qc.setQueryData(['messages', conversationId], (old: Message[] | undefined) => {
        if (old?.some((m) => m.id === msg.id)) return old
        return [...(old ?? []), msg]
      })
    },
  })
}
