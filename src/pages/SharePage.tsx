import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { HardHat, MapPin, Calendar, Users, Camera, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getPhotoUrl } from '../hooks/usePhotos'
import { WEATHER_LABELS } from '../types'
import type { ConstructionObject, Entry, EntryWorker, EntryPhoto } from '../types'
import { Spinner } from '../components/shared/Spinner'

interface EntryWithDetails {
  entry: Entry
  workers: EntryWorker[]
  photos: EntryPhoto[]
}

export function SharePage() {
  const { token } = useParams<{ token: string }>()
  const [object, setObject] = useState<ConstructionObject | null>(null)
  const [entries, setEntries] = useState<EntryWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: tokenRow, error: tErr } = await supabase
        .from('share_tokens')
        .select('*, objects(*)')
        .eq('token', token)
        .single()

      if (tErr || !tokenRow) { setError('Ссылка недействительна или устарела'); setLoading(false); return }

      const obj = tokenRow.objects as ConstructionObject
      setObject(obj)

      const { data: entriesData } = await supabase
        .from('entries')
        .select('*, entry_workers(*), entry_photos(*)')
        .eq('object_id', obj.id)
        .order('date', { ascending: false })

      setEntries((entriesData ?? []).map((e: any) => ({
        entry: e,
        workers: e.entry_workers ?? [],
        photos: e.entry_photos ?? [],
      })))
      setLoading(false)
    }
    load()
  }, [token])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Spinner />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-14 h-14 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-gray-600" />
        </div>
        <p className="text-gray-300 font-medium">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-orange-500 rounded-xl flex items-center justify-center">
              <HardHat className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm text-gray-500">Журнал объекта · только просмотр</span>
          </div>
          <h1 className="text-xl font-bold text-white">{object?.name}</h1>
          <div className="flex flex-col gap-1.5 mt-3">
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin className="w-3.5 h-3.5" /> {object?.address}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <Calendar className="w-3.5 h-3.5" /> Начало: {object?.start_date && new Date(object.start_date).toLocaleDateString('ru')}
            </span>
          </div>
          <div className="mt-4 text-sm text-gray-600">{entries.length} записей в журнале</div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        {entries.map(({ entry, workers, photos }) => (
          <div key={entry.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-200">
                {new Date(entry.date + 'T00:00:00').toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <span className="text-sm text-gray-500">
                {WEATHER_LABELS[entry.weather as keyof typeof WEATHER_LABELS] ?? entry.weather}
                {entry.temperature != null && `, ${entry.temperature}°C`}
              </span>
            </div>

            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed mb-3">{entry.work_description}</p>

            {workers.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                {workers.map((w) => `${w.name} (${w.hours}ч.)`).join(', ')}
              </div>
            )}

            {photos.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
                  <Camera className="w-3.5 h-3.5" /> {photos.length} фото
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((p) => (
                    <img
                      key={p.id}
                      src={getPhotoUrl(p.storage_path)}
                      alt=""
                      className="aspect-square rounded-xl object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
              </div>
            )}

            {entry.notes && (
              <p className="mt-3 text-xs text-gray-600 italic">{entry.notes}</p>
            )}
          </div>
        ))}
      </main>
    </div>
  )
}
