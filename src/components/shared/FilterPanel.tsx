import { useState, type ReactNode } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

interface Props {
  activeCount: number
  onReset: () => void
  children: ReactNode
}

/** Складная панель фильтров — используется в лентах заказов и разнорабочих. */
export function FilterPanel({ activeCount, onReset, children }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors
            ${activeCount > 0 ? 'bg-copper-500/10 border-copper-500/30 text-copper-hover' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Фильтры
          {activeCount > 0 && <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-copper-500 text-white text-xs leading-none">{activeCount}</span>}
        </button>
        {activeCount > 0 && (
          <button type="button" onClick={onReset} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300">
            <X className="w-3.5 h-3.5" /> Сбросить
          </button>
        )}
      </div>
      {open && (
        <div className="mt-3 p-4 bg-gray-900 border border-gray-800 rounded-2xl flex flex-col gap-3">
          {children}
        </div>
      )}
    </div>
  )
}
