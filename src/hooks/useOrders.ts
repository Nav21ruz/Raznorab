import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Order, OrderFeedFilters, OrderStatus } from '../types/marketplace'

export function useOrdersFeed(builderId: string | undefined, filters?: OrderFeedFilters) {
  return useQuery({
    queryKey: ['orders', 'feed', builderId, filters],
    queryFn: () => api.orders.feed(filters),
    enabled: !!builderId,
  })
}

export function useMyOrders(customerId: string | undefined) {
  return useQuery({
    queryKey: ['orders', 'mine', customerId],
    queryFn: () => api.orders.mine(),
    enabled: !!customerId,
  })
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['orders', 'one', id],
    queryFn: () => api.orders.get(id as string),
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (order: Omit<Order, 'id' | 'customer_id' | 'created_at' | 'status'>) => api.orders.create(order),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => api.orders.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}
