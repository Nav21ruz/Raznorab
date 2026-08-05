import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Order, OrderStatus } from '../types/marketplace'

export function useOrdersFeed(builderId: string | undefined) {
  return useQuery({
    queryKey: ['orders', 'feed', builderId],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      if (error) throw error

      const { data: swipes, error: swErr } = await supabase
        .from('order_swipes')
        .select('order_id')
        .eq('builder_id', builderId)
      if (swErr) throw swErr

      const swipedIds = new Set((swipes as { order_id: string }[]).map((s) => s.order_id))
      return (orders as Order[]).filter((o) => !swipedIds.has(o.id) && o.customer_id !== builderId)
    },
    enabled: !!builderId,
  })
}

export function useMyOrders(customerId: string | undefined) {
  return useQuery({
    queryKey: ['orders', 'mine', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId as string)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Order[]
    },
    enabled: !!customerId,
  })
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['orders', 'one', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id as string).single()
      if (error) throw error
      return data as Order
    },
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (order: Omit<Order, 'id' | 'customer_id' | 'created_at' | 'status'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('orders')
        .insert({ ...order, customer_id: user!.id, status: 'active' })
        .select()
        .single()
      if (error) throw error
      return data as Order
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single()
      if (error) throw error
      return data as Order
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}
