import { Link } from 'react-router-dom'
import { MapPin, Calendar, ChevronRight, Trash2 } from 'lucide-react'
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
    }
  }

  return (
    <Link
      to={`/objects/${object.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-orange-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
            {object.name}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{object.address}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-sm text-gray-500">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>Начало: {new Date(object.start_date).toLocaleDateString('ru')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-gray-400 opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-500">
        <span className="font-medium text-gray-700">{entriesCount} {plural(entriesCount, 'запись', 'записи', 'записей')}</span>
        {lastDate && <span>Последняя: {new Date(lastDate).toLocaleDateString('ru')}</span>}
      </div>
    </Link>
  )
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}
