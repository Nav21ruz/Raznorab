import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, Camera } from 'lucide-react'
import { useEntry, useDeleteEntry, useUpdateEntry } from '../hooks/useEntries'
import { usePhotos } from '../hooks/usePhotos'
import { PhotoGrid } from '../components/journal/PhotoGrid'
import { EntryForm, type EntryFormData } from '../components/journal/EntryForm'
import { Modal } from '../components/shared/Modal'
import { Spinner } from '../components/shared/Spinner'
import { WEATHER_LABELS } from '../types'

export function EntryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useEntry(id!)
  const { data: photos } = usePhotos(id!)
  const { mutateAsync: updateEntry } = useUpdateEntry()
  const { mutate: deleteEntry } = useDeleteEntry()
  const [showEdit, setShowEdit] = useState(false)

  if (isLoading) return <Spinner className="mt-24" />
  if (!data) return null

  const entry = data
  const workers: import('../types').EntryWorker[] = (data as any).entry_workers ?? []
  const weather = WEATHER_LABELS[entry.weather as keyof typeof WEATHER_LABELS] ?? entry.weather

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
    setShowEdit(false)
  }

  const handleDelete = () => {
    if (confirm('Удалить эту запись?')) {
      deleteEntry({ id: id!, objectId: entry.object_id })
      navigate(`/objects/${entry.object_id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={`/objects/${entry.object_id}`} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="flex-1 font-bold text-gray-900">
            {new Date(entry.date + 'T00:00:00').toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h1>
          <button onClick={() => setShowEdit(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={handleDelete} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-gray-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm text-gray-500 mb-3">
            {weather}{entry.temperature != null && `, ${entry.temperature}°C`}
          </div>

          <h2 className="text-sm font-semibold text-gray-700 mb-2">Выполненные работы</h2>
          <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">{entry.work_description}</p>

          {entry.notes && (
            <>
              <h2 className="text-sm font-semibold text-gray-700 mt-4 mb-2">Заметки</h2>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{entry.notes}</p>
            </>
          )}
        </div>

        {workers.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Рабочие ({workers.length} чел.)</h2>
            <div className="flex flex-col gap-2">
              {workers.map((w) => (
                <div key={w.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-800">{w.name}</span>
                  <span className="text-gray-500">{w.hours} ч.</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Фото ({photos?.length ?? 0}/10)</h2>
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
