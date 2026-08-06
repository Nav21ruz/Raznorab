import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Conversation, Order, OrderSwipe, Profile, BuilderProfile, SwipeDirection } from '../types/marketplace'

export function useSwipeOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, direction }: { orderId: string; direction: SwipeDirection }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('order_swipes')
        .insert({ order_id: orderId, builder_id: user!.id, direction, reviewed_by_customer: false })
        .select()
        .single()
      if (error) throw error
      return data as OrderSwipe
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders', 'feed'] }),
  })
}

export interface OrderCandidate {
  swipe: OrderSwipe
  profile: Profile
  builderProfile: BuilderProfile | null
}

export function useOrderCandidates(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order_candidates', orderId],
    queryFn: async () => {
      const { data: swipes, error } = await supabase
        .from('order_swipes')
        .select('*')
        .eq('order_id', orderId as string)
        .eq('direction', 'like')
        .eq('reviewed_by_customer', false)
        .order('created_at', { ascending: true })
      if (error) throw error

      const rows = swipes as OrderSwipe[]
      if (rows.length === 0) return []

      const builderIds = rows.map((s) => s.builder_id)
      const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').in('id', builderIds)
      if (pErr) throw pErr
      const { data: builderProfiles, error: bErr } = await supabase.from('builder_profiles').select('*').in('id', builderIds)
      if (bErr) throw bErr

      const profileMap = new Map((profiles as Profile[]).map((p) => [p.id, p]))
      const builderMap = new Map((builderProfiles as BuilderProfile[]).map((b) => [b.id, b]))

      // подстраховка: скрываем и тех, с кем уже есть чат, даже если reviewed_by_customer почему-то не проставился
      const { data: existingConvs } = await supabase
        .from('conversations')
        .select('worker_id')
        .eq('order_id', orderId as string)
      const matchedIds = new Set(((existingConvs ?? []) as { worker_id: string }[]).map((c) => c.worker_id))

      return rows
        .filter((s) => !matchedIds.has(s.builder_id) && profileMap.has(s.builder_id))
        .map((s) => ({ swipe: s, profile: profileMap.get(s.builder_id)!, builderProfile: builderMap.get(s.builder_id) ?? null }))
    },
    enabled: !!orderId,
  })
}

export function useConfirmMatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, builderId }: { orderId: string; builderId: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: conversation, error: convErr } = await supabase
        .from('conversations')
        .insert({ kind: 'order', order_id: orderId, customer_id: user!.id, worker_id: builderId })
        .select()
        .single()
      if (convErr) throw convErr

      const { error: swipeErr } = await supabase
        .from('order_swipes')
        .update({ reviewed_by_customer: true })
        .eq('order_id', orderId)
        .eq('builder_id', builderId)
      if (swipeErr) throw swipeErr

      // заказ переходит "в работу" — перестаёт попадать в общую ленту для других строителей
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ status: 'in_progress' })
        .eq('id', orderId)
        .eq('status', 'active')
      if (orderErr) throw orderErr

      return conversation as Conversation
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['order_candidates', vars.orderId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useRejectCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, builderId }: { orderId: string; builderId: string }) => {
      const { error } = await supabase
        .from('order_swipes')
        .update({ reviewed_by_customer: true })
        .eq('order_id', orderId)
        .eq('builder_id', builderId)
      if (error) throw error
    },
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['order_candidates', vars.orderId] }),
  })
}

export interface MyResponse {
  swipe: OrderSwipe
  order: Order
}

export function useMyOrderResponses(builderId: string | undefined) {
  return useQuery({
    queryKey: ['order_swipes', 'mine', builderId],
    queryFn: async () => {
      const { data: swipes, error } = await supabase
        .from('order_swipes')
        .select('*')
        .eq('builder_id', builderId as string)
        .eq('direction', 'like')
        .order('created_at', { ascending: false })
      if (error) throw error
      const rows = swipes as OrderSwipe[]
      if (rows.length === 0) return []
      const orderIds = rows.map((s) => s.order_id)
      const { data: orders, error: oErr } = await supabase.from('orders').select('*').in('id', orderIds)
      if (oErr) throw oErr
      const orderMap = new Map((orders as Order[]).map((o) => [o.id, o]))
      return rows
        .filter((s) => orderMap.has(s.order_id))
        .map((s) => ({ swipe: s, order: orderMap.get(s.order_id)! }))
    },
    enabled: !!builderId,
  })
}
