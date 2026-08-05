import type { ReactNode } from 'react'

export function CardShell({ children }: { children: ReactNode }) {
  return (
    <div className="w-full h-full rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl overflow-hidden flex flex-col">
      {children}
    </div>
  )
}
