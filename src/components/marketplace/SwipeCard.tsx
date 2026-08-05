import { useEffect, type ReactNode } from 'react'
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion'

export type SwipeDirection = 'like' | 'pass'

interface Props {
  children: ReactNode
  depth: number
  isTop: boolean
  exitDirection: SwipeDirection | null
  onDecide: (direction: SwipeDirection) => void
}

const EXIT_DISTANCE = 560
const DECISION_OFFSET = 120
const DECISION_VELOCITY = 500

export function SwipeCard({ children, depth, isTop, exitDirection, onDecide }: Props) {
  const controls = useAnimation()
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 300], [-18, 18])
  const likeOpacity = useTransform(x, [20, 120], [0, 1])
  const passOpacity = useTransform(x, [-120, -20], [1, 0])

  useEffect(() => {
    if (!exitDirection) return
    const target = exitDirection === 'like' ? EXIT_DISTANCE : -EXIT_DISTANCE
    controls.start({ x: target, rotate: exitDirection === 'like' ? 20 : -20, opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } })
  }, [exitDirection, controls])

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        zIndex: 10 - depth,
        scale: 1 - depth * 0.04,
        top: depth * 10,
      }}
      animate={!exitDirection ? { scale: 1 - depth * 0.04, top: depth * 10, opacity: 1 } : controls}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      drag={isTop && !exitDirection ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={(_e, info) => {
        if (info.offset.x > DECISION_OFFSET || info.velocity.x > DECISION_VELOCITY) {
          onDecide('like')
        } else if (info.offset.x < -DECISION_OFFSET || info.velocity.x < -DECISION_VELOCITY) {
          onDecide('pass')
        } else {
          controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } })
        }
      }}
    >
      <div className="relative w-full h-full">
        {children}
        {isTop && (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-6 left-6 px-3 py-1.5 rounded-xl border-2 border-emerald-400 text-emerald-400 font-bold text-lg -rotate-12 pointer-events-none bg-gray-950/60"
            >
              ОТКЛИК
            </motion.div>
            <motion.div
              style={{ opacity: passOpacity }}
              className="absolute top-6 right-6 px-3 py-1.5 rounded-xl border-2 border-red-400 text-red-400 font-bold text-lg rotate-12 pointer-events-none bg-gray-950/60"
            >
              ПРОПУСК
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  )
}
