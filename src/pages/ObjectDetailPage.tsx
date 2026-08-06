import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Share2, FileDown, Copy, Check, MapPin, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { randomId } from '../lib/uuid'
import { useObject } from '../hooks/useObjects'
import { useEntries } from '../hooks/useEntries'
import { usePhotos } from '../hooks/usePhotos'
import { EntryCard } from '../components/journal/EntryCard'
import { Spinner } from '../components/shared/Spinner'
import { Button } from '../components/shared/Button'
import { PDFReport } from '../components/journal/PDFReport'
import { Modal } from '../components/shared/Modal'
import { Navbar } from '../components/shared/Navbar'
import type { Entry } from '../types'

export function ObjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: object, isLoading: objLoading } = useObject(id!)
  const { data: entries, isLoading: entriesLoading } = useEntries(id!)
  const [shareUrl, setShareUrl] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [showPDF, setShowPDF] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateShareLink = async () => {
    const token = randomId()
    const { error } = await supabase.from('share_tokens').insert({ object_id: id, token })
    if (!error) {
      const url = `${window.location.origin}/share/${token}`
      setShareUrl(url)
      setShowShare(true)
    } else {
      toast.error('Не удалось создать ссылку')
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Ссылка скопирована')
    setTimeout(() => setCopied(false), 2000)
  }

  if (objLoading) return <><Navbar /><Spinner className="mt-24" /></>

  const totalDays = entries?.length ?? 0
  const daysSinceStart = object ? Math.floor((Date.now() - new Date(object.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 0

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <Link to="/journal" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Все объекты
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{object?.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="w-3.5 h-3.5" /> {object?.address}
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="w-3.5 h-3.5" /> {object?.start_date && new Date(object.start_date).toLocaleDateString('ru')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={generateShareLink} className="p-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-400 hover:text-gray-200 transition-all" title="Поделиться">
                <Share2 className="w-4 h-4" />
              </button>
              <button onClick={() => setShowPDF(true)} className="p-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-400 hover:text-gray-200 transition-all" title="PDF">
                <FileDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: 'Рабочих дней', value: totalDays },
              { label: 'Дней с начала', value: daysSinceStart },
              { label: 'Прогресс', value: totalDays > 0 ? `${Math.round((totalDays / Math.max(daysSinceStart, 1)) * 100)}%` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-200">Записи журнала</h2>
          <Link to={`/journal/objects/${id}/new-entry`}>
            <Button size="sm"><Plus className="w-4 h-4" /> Запись за день</Button>
          </Link>
        </div>

        {entriesLoading && <Spinner className="mt-12" />}

        {!entriesLoading && entries?.length === 0 && (
          <div className="text-center py-20 text-gray-600">
            <p className="font-medium text-gray-500">Нет записей</p>
            <p className="text-sm mt-1">Нажмите «Запись за день» чтобы добавить первую</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {entries?.map((entry) => (
            <EntryCardWithStats key={entry.id} entry={entry} />
          ))}
        </div>
      </main>

      <Modal open={showShare} onClose={() => setShowShare(false)} title="Ссылка для заказчика">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-400">Заказчик сможет просматривать журнал без авторизации:</p>
          <div className="flex gap-2">
            <input value={shareUrl} readOnly className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-300 outline-none" />
            <Button variant="secondary" onClick={copyLink} size="sm">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showPDF} onClose={() => setShowPDF(false)} title="Экспорт в PDF">
        {object && entries && (
          <PDFReport object={object} entries={entries} onClose={() => setShowPDF(false)} />
        )}
      </Modal>
    </div>
  )
}

function EntryCardWithStats({ entry }: { entry: Entry }) {
  const { data: photos } = usePhotos(entry.id)
  return <EntryCard entry={entry} photosCount={photos?.length ?? 0} />
}
