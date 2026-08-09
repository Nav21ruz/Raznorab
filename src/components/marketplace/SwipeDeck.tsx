import { useMemo, useState, type ReactNode } from 'react'
import { Heart, X } from 'lucide-react'
import { SwipeCard, type SwipeDirection } from './SwipeCard'

interface Props<T> {
  items: T[]
  keyExtractor: (item: T) => string
  renderCard: (item: T) => ReactNode
  onDecide: (item: T, direction: SwipeDirection) => void
  emptyState: ReactNode
  height?: number
}

export function SwipeDeck<T>({ items, keyExtractor, renderCard, onDecide, emptyState, height = 520 }: Props<T>) {
  const [decidedIds, setDecidedIds] = useState<Set<string>>(new Set())
  const [exiting, setExiting] = useState<{ id: string; direction: SwipeDirection } | null>(null)

  const queue = useMemo(
    () => items.filter((item) => !decidedIds.has(keyExtractor(item))),
    [items, decidedIds, keyExtractor],
  )
  const visible = queue.slice(0, 3)

  function commit(item: T, direction: SwipeDirection) {
    const id = keyExtractor(item)
    if (exiting) return
    setExiting({ id, direction })
    window.setTimeout(() => {
      setDecidedIds((prev) => {
        const next = new Set(prev)
        next.add(id)
        return next
      })
      setExiting(null)
      onDecide(item, direction)
    }, 250)
  }

  if (visible.length === 0) {
    return <>{emptyState}</>
  }

  const top = queue[0]

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-full" style={{ height }}>
        {visible.map((item, idx) => (
          <SwipeCard
            key={keyExtractor(item)}
            depth={idx}
            isTop={idx === 0}
            exitDirection={exiting?.id === keyExtractor(item) ? exiting.direction : null}
            onDecide={(direction) => commit(item, direction)}
          >
            {renderCard(item)}
          </SwipeCard>
        ))}
      </div>

      <div className="flex items-center justify-center gap-5">
        <button
          onClick={() => commit(top, 'pass')}
          disabled={!!exiting}
          className="w-14 h-14 rounded-full bg-bg-card border border-border-1 flex items-center justify-center text-error-text shadow-lg hover:bg-border-1 active:scale-95 transition-all disabled:opacity-40"
          aria-label="Пропустить"
        >
          <X className="w-6 h-6" />
        </button>
        <button
          onClick={() => commit(top, 'like')}
          disabled={!!exiting}
          className="w-16 h-16 rounded-full bg-copper-500 flex items-center justify-center text-white shadow-lg shadow-copper-500/30 hover:bg-copper-hover active:scale-95 transition-all disabled:opacity-40"
          aria-label="Откликнуться"
        >
          <Heart className="w-7 h-7" fill="currentColor" />
        </button>
      </div>
    </div>
  )
}
