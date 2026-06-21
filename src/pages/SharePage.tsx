import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { HardHat, MapPin, Calendar, Users, Camera } from 'lucide-react'
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

      if (tErr || !tokenRow) { setError('Ссылка недействительна'); setLoading(false); return }

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

  if (loading) return <Spinner className="mt-24" />
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">{error}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <HardHat className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-gray-500">Журнал объекта — только для просмотра</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{object?.name}</h1>
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="w-3.5 h-3.5" /> {object?.address}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="w-3.5 h-3.5" /> Начало: {object?.start_date && new Date(object.start_date).toLocaleDateString('ru')}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        <p className="text-sm text-gray-500">{entries.length} записей в журнале</p>
        {entries.map(({ entry, workers, photos }) => (
          <div key={entry.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">
                {new Date(entry.date + 'T00:00:00').toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <span className="text-sm text-gray-500">
                {WEATHER_LABELS[entry.weather as keyof typeof WEATHER_LABELS] ?? entry.weather}
                {entry.temperature != null && `, ${entry.temperature}°C`}
              </span>
            </div>

            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{entry.work_description}</p>

            {workers.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <Users className="w-3.5 h-3.5" />
                {workers.map((w) => `${w.name} (${w.hours}ч.)`).join(', ')}
              </div>
            )}

            {photos.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                  <Camera className="w-3 h-3" /> {photos.length} фото
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((p) => (
                    <img
                      key={p.id}
                      src={getPhotoUrl(p.storage_path)}
                      alt=""
                      className="aspect-square rounded-lg object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
              </div>
            )}

            {entry.notes && (
              <p className="mt-3 text-xs text-gray-400 italic">{entry.notes}</p>
            )}
          </div>
        ))}
      </main>
    </div>
  )
}
