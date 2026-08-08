import { Star } from 'lucide-react'
import { useProfileReviews } from '../../hooks/useReviews'

export function RatingBadge({ profileId, className = '' }: { profileId: string; className?: string }) {
  const { data } = useProfileReviews(profileId)
  if (!data || data.count === 0) return null

  return (
    <span className={`inline-flex items-center gap-1 text-sm text-gray-300 ${className}`}>
      <Star className="w-3.5 h-3.5 text-copper-400 fill-copper-400" />
      {data.average?.toFixed(1)}
      <span className="text-gray-500">({data.count})</span>
    </span>
  )
}
