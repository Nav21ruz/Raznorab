import type { ReactNode } from 'react'

export function CardShell({ children }: { children: ReactNode }) {
  return (
    <div className="w-full h-full rounded-3xl bg-bg-card border border-border-1 shadow-2xl overflow-hidden flex flex-col">
      {children}
    </div>
  )
}
