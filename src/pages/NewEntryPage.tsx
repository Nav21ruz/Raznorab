import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateEntry } from '../hooks/useEntries'
import { EntryForm, type EntryFormData } from '../components/journal/EntryForm'
import { Navbar } from '../components/shared/Navbar'

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
    toast.success('Запись добавлена')
    navigate(`/entries/${entry.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to={`/objects/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Назад к объекту
        </Link>
        <h1 className="text-xl font-bold text-white mb-6">Запись за день</h1>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <EntryForm onSubmit={handleSubmit} submitLabel="Создать запись" />
        </div>
      </div>
    </div>
  )
}
