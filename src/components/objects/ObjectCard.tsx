import { Link } from 'react-router-dom'
import { MapPin, Calendar, ChevronRight, Trash2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import type { ConstructionObject } from '../../types'
import { useDeleteObject } from '../../hooks/useObjects'

interface Props {
  object: ConstructionObject
  entriesCount?: number
  lastDate?: string
}

export function ObjectCard({ object, entriesCount = 0, lastDate }: Props) {
  const { mutate: deleteObject } = useDeleteObject()

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    if (confirm(`Удалить объект "${object.name}"? Все записи будут утеряны.`)) {
      deleteObject(object.id)
      toast.success('Объект удалён')
    }
  }

  const daysSinceStart = Math.floor(
    (Date.now() - new Date(object.start_date).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Link
      to={`/objects/${object.id}`}
      className="block bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-orange-500/50 hover:bg-gray-800/50 transition-all duration-200 group animate-fade-in"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            <h3 className="font-semibold text-gray-100 truncate group-hover:text-orange-400 transition-colors">
              {object.name}
            </h3>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{object.address}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>Начало: {new Date(object.start_date).toLocaleDateString('ru')} · {daysSinceStart} дн.</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleDelete}
            className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors text-gray-600 opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-orange-400 transition-colors" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-800 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm">
          <FileText className="w-3.5 h-3.5 text-gray-600" />
          <span className="font-semibold text-gray-300">{entriesCount}</span>
          <span className="text-gray-600">{plural(entriesCount, 'запись', 'записи', 'записей')}</span>
        </div>
        {lastDate && (
          <span className="text-xs text-gray-600">
            Последняя: {new Date(lastDate).toLocaleDateString('ru')}
          </span>
        )}
        {entriesCount === 0 && (
          <span className="text-xs text-orange-500/70 italic">Нет записей</span>
        )}
      </div>
    </Link>
  )
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10, mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}
