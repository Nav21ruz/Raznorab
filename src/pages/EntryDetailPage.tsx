import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { useEntry, useDeleteEntry, useUpdateEntry } from '../hooks/useEntries'
import { usePhotos } from '../hooks/usePhotos'
import { PhotoGrid } from '../components/journal/PhotoGrid'
import { EntryForm, type EntryFormData } from '../components/journal/EntryForm'
import { Modal } from '../components/shared/Modal'
import { Spinner } from '../components/shared/Spinner'
import { Navbar } from '../components/shared/Navbar'
import { WEATHER_LABELS } from '../types'
import type { EntryWorker } from '../types'

export function EntryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useEntry(id!)
  const { data: photos } = usePhotos(id!)
  const { mutateAsync: updateEntry } = useUpdateEntry()
  const { mutate: deleteEntry } = useDeleteEntry()
  const [showEdit, setShowEdit] = useState(false)

  if (isLoading) return <><Navbar /><Spinner className="mt-24" /></>
  if (!data) return null

  const entry = data
  const workers: EntryWorker[] = data.entry_workers ?? []
  const weather = WEATHER_LABELS[entry.weather as keyof typeof WEATHER_LABELS] ?? entry.weather
  const totalHours = workers.reduce((s, w) => s + w.hours, 0)

  const handleUpdate = async (formData: EntryFormData) => {
    await updateEntry({
      id: id!,
      entry: {
        date: formData.date,
        weather: formData.weather,
        temperature: formData.temperature ?? null,
        work_description: formData.work_description,
        notes: formData.notes ?? null,
      },
      workers: (formData.workers ?? []).map((w) => ({ name: w.name, hours: w.hours })),
    })
    toast.success('Запись обновлена')
    setShowEdit(false)
  }

  const handleDelete = () => {
    if (confirm('Удалить эту запись?')) {
      deleteEntry({ id: id!, objectId: entry.object_id })
      toast.success('Запись удалена')
      navigate(`/journal/objects/${entry.object_id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <Link to={`/journal/objects/${entry.object_id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> К объекту
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white">
                {new Date(entry.date + 'T00:00:00').toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {weather}{entry.temperature != null && `, ${entry.temperature}°C`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowEdit(true)} className="p-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-400 hover:text-gray-200 transition-all">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={handleDelete} className="p-2.5 bg-gray-800 hover:bg-red-500/10 border border-gray-700 rounded-xl text-gray-400 hover:text-red-400 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {workers.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-blue-400">{workers.length}</div>
                <div className="text-xs text-gray-500">Рабочих</div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-purple-400">{totalHours}</div>
                <div className="text-xs text-gray-500">Человеко-часов</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Выполненные работы</h2>
          <p className="text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">{entry.work_description}</p>

          {entry.notes && (
            <>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-2">Заметки</h2>
              <p className="text-gray-400 text-sm whitespace-pre-wrap italic">{entry.notes}</p>
            </>
          )}
        </div>

        {workers.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Рабочие · {workers.length} чел.
            </h2>
            <div className="flex flex-col gap-2">
              {workers.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <span className="text-gray-200 text-sm">{w.name}</span>
                  <span className="text-sm text-gray-500 bg-gray-800 px-2.5 py-1 rounded-lg">{w.hours} ч.</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-4 h-4 text-gray-600" />
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Фото · {photos?.length ?? 0}/10
            </h2>
          </div>
          <PhotoGrid entryId={id!} photos={photos ?? []} />
        </div>
      </main>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Редактировать запись">
        <EntryForm
          defaultValues={{
            date: entry.date,
            weather: entry.weather,
            temperature: entry.temperature,
            work_description: entry.work_description,
            notes: entry.notes ?? '',
            workers: workers.map((w) => ({ name: w.name, hours: w.hours })),
          }}
          onSubmit={handleUpdate}
          submitLabel="Сохранить изменения"
        />
      </Modal>
    </div>
  )
}
