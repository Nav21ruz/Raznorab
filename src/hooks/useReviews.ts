import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useProfileReviews(profileId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', 'profile', profileId],
    queryFn: () => api.reviews.forProfile(profileId as string),
    enabled: !!profileId,
  })
}

export function useMyReview(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', 'mine', conversationId],
    queryFn: () => api.conversations.myReview(conversationId as string),
    enabled: !!conversationId,
  })
}

export function useCreateReview(conversationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment?: string }) =>
      api.conversations.createReview(conversationId, rating, comment),
    onSuccess: (review) => {
      qc.setQueryData(['reviews', 'mine', conversationId], review)
      qc.invalidateQueries({ queryKey: ['reviews', 'profile', review.reviewee_id] })
    },
  })
}
