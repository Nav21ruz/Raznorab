import { Link } from 'react-router-dom'
import { Users, Camera, ChevronRight } from 'lucide-react'
import type { Entry } from '../../types'
import { WEATHER_LABELS } from '../../types'

interface Props {
  entry: Entry
  workersCount?: number
  photosCount?: number
}

export function EntryCard({ entry, workersCount = 0, photosCount = 0 }: Props) {
  const weather = WEATHER_LABELS[entry.weather as keyof typeof WEATHER_LABELS] ?? entry.weather

  return (
    <Link
      to={`/entries/${entry.id}`}
      className="block bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-orange-500/40 hover:bg-gray-800/50 transition-all duration-200 group animate-fade-in"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-semibold text-gray-200">
              {new Date(entry.date + 'T00:00:00').toLocaleDateString('ru', { weekday: 'short', day: 'numeric', month: 'long' })}
            </span>
            <span className="text-sm text-gray-500">
              {weather}
              {entry.temperature != null && `, ${entry.temperature}°C`}
            </span>
          </div>
          <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">{entry.work_description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-orange-400 transition-colors shrink-0 mt-0.5" />
      </div>

      {(workersCount > 0 || photosCount > 0) && (
        <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-4 text-sm text-gray-600">
          {workersCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-gray-400">{workersCount} чел.</span>
            </span>
          )}
          {photosCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-gray-400">{photosCount} фото</span>
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
