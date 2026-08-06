import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { BuilderProfile, OrderSwipe, Profile, SwipeDirection } from '../types/marketplace'

export interface OrderCandidate {
  swipe: OrderSwipe
  profile: Profile
  builderProfile: BuilderProfile | null
}

export function useSwipeOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, direction }: { orderId: string; direction: SwipeDirection }) =>
      api.orders.swipe(orderId, direction),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders', 'feed'] }),
  })
}

export function useOrderCandidates(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order_candidates', orderId],
    queryFn: () => api.orders.candidates(orderId as string),
    enabled: !!orderId,
  })
}

export function useConfirmMatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, builderId }: { orderId: string; builderId: string }) => api.orders.confirmMatch(orderId, builderId),
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
    mutationFn: ({ orderId, builderId }: { orderId: string; builderId: string }) => api.orders.rejectCandidate(orderId, builderId),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['order_candidates', vars.orderId] }),
  })
}

export function useMyOrderResponses(builderId: string | undefined) {
  return useQuery({
    queryKey: ['order_swipes', 'mine', builderId],
    queryFn: () => api.orderSwipes.mine(),
    enabled: !!builderId,
  })
}
