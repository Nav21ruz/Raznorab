import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Share2, FileDown, Copy, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useObject } from '../hooks/useObjects'
import { useEntries } from '../hooks/useEntries'
import { usePhotos } from '../hooks/usePhotos'
import { EntryCard } from '../components/journal/EntryCard'
import { Spinner } from '../components/shared/Spinner'
import { Button } from '../components/shared/Button'
import { PDFReport } from '../components/journal/PDFReport'
import { Modal } from '../components/shared/Modal'

export function ObjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: object, isLoading: objLoading } = useObject(id!)
  const { data: entries, isLoading: entriesLoading } = useEntries(id!)
  const [shareUrl, setShareUrl] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [showPDF, setShowPDF] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateShareLink = async () => {
    const token = crypto.randomUUID()
    const { error } = await supabase.from('share_tokens').insert({ object_id: id, token })
    if (!error) {
      const url = `${window.location.origin}/share/${token}`
      setShareUrl(url)
      setShowShare(true)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (objLoading) return <Spinner className="mt-24" />

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate">{object?.name}</h1>
            <p className="text-xs text-gray-500 truncate">{object?.address}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={generateShareLink} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Поделиться">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={() => setShowPDF(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Экспорт PDF">
              <FileDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Журнал записей</h2>
          <Link to={`/objects/${id}/new-entry`}>
            <Button size="sm"><Plus className="w-4 h-4" /> Запись</Button>
          </Link>
        </div>

        {entriesLoading && <Spinner className="mt-12" />}

        {!entriesLoading && entries?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="font-medium">Нет записей</p>
            <p className="text-sm mt-1">Нажмите «+ Запись» чтобы добавить первую</p>
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
          <p className="text-sm text-gray-600">Заказчик сможет просматривать журнал без авторизации по этой ссылке:</p>
          <div className="flex gap-2">
            <input value={shareUrl} readOnly className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 outline-none" />
            <Button variant="secondary" onClick={copyLink} size="sm">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          {copied && <p className="text-xs text-green-600">Скопировано!</p>}
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

function EntryCardWithStats({ entry }: { entry: import('../types').Entry }) {
  const { data: photos } = usePhotos(entry.id)
  const workersCount = 0
  return <EntryCard entry={entry} workersCount={workersCount} photosCount={photos?.length ?? 0} />
}
