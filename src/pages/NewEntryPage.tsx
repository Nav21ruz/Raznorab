import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCreateEntry } from '../hooks/useEntries'
import { EntryForm, type EntryFormData } from '../components/journal/EntryForm'

export function NewEntryPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { mutateAsync } = useCreateEntry()

  const handleSubmit = async (data: EntryFormData) => {
    const entry = await mutateAsync({
      entry: {
        object_id: id!,
        date: data.date,
        weather: data.weather,
        temperature: data.temperature ?? null,
        work_description: data.work_description,
        notes: data.notes ?? null,
      },
      workers: (data.workers ?? []).map((w) => ({ name: w.name, hours: w.hours })),
    })
    navigate(`/entries/${entry.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={`/objects/${id}`} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-gray-900">Новая запись</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <EntryForm onSubmit={handleSubmit} submitLabel="Создать запись" />
      </main>
    </div>
  )
}
