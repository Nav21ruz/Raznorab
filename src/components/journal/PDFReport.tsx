import { useRef, useState } from 'react'
import { FileDown } from 'lucide-react'
import { Button } from '../shared/Button'
import type { ConstructionObject, Entry } from '../../types'
import { WEATHER_LABELS } from '../../types'
import { useEntry } from '../../hooks/useEntries'
import { getPhotoUrl } from '../../hooks/usePhotos'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface Props {
  object: ConstructionObject
  entries: Entry[]
  onClose: () => void
}

export function PDFReport({ object, entries, onClose }: Props) {
  const reportRef = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const filtered = entries.filter((e) => {
    if (from && e.date < from) return false
    if (to && e.date > to) return false
    return true
  })

  const generate = async () => {
    if (!reportRef.current) return
    setGenerating(true)
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pw = pdf.internal.pageSize.getWidth()
      const ph = pdf.internal.pageSize.getHeight()
      const imgH = (canvas.height * pw) / canvas.width
      let y = 0
      while (y < imgH) {
        if (y > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -y, pw, imgH)
        y += ph
      }
      pdf.save(`Журнал_${object.name}_${new Date().toLocaleDateString('ru')}.pdf`)
      onClose()
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Период с</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-orange-400" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">по</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-orange-400" />
        </div>
      </div>
      <p className="text-sm text-gray-500">Записей в отчёте: {filtered.length}</p>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Отмена</Button>
        <Button onClick={generate} loading={generating} disabled={filtered.length === 0}>
          <FileDown className="w-4 h-4" /> Скачать PDF
        </Button>
      </div>

      {/* Скрытый HTML для рендера PDF */}
      <div
        ref={reportRef}
        style={{ position: 'absolute', left: '-9999px', top: 0, width: '794px', background: '#fff', padding: '40px', fontFamily: 'sans-serif' }}
      >
        <div style={{ borderBottom: '2px solid #f97316', paddingBottom: '16px', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Журнал объекта</h1>
          <h2 style={{ fontSize: '18px', margin: '8px 0 4px', color: '#374151' }}>{object.name}</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{object.address}</p>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
            Начало работ: {new Date(object.start_date).toLocaleDateString('ru')}
            {(from || to) && ` | Период: ${from ? new Date(from).toLocaleDateString('ru') : '—'} — ${to ? new Date(to).toLocaleDateString('ru') : '—'}`}
          </p>
        </div>

        {filtered.map((entry, i) => (
          <EntryPrintBlock key={entry.id} entry={entry} index={i + 1} />
        ))}

        <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', fontSize: '12px', color: '#9ca3af', textAlign: 'right' }}>
          Сформировано: {new Date().toLocaleDateString('ru')} | Всего записей: {filtered.length}
        </div>
      </div>
    </div>
  )
}

function EntryPrintBlock({ entry, index }: { entry: Entry; index: number }) {
  const { data } = useEntry(entry.id)
  const workers: import('../../types').EntryWorker[] = (data as any)?.entry_workers ?? []
  const photos: import('../../types').EntryPhoto[] = (data as any)?.entry_photos ?? []
  const weather = WEATHER_LABELS[entry.weather as keyof typeof WEATHER_LABELS] ?? entry.weather

  return (
    <div style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
          #{index} — {new Date(entry.date + 'T00:00:00').toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </h3>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>{weather}{entry.temperature != null && `, ${entry.temperature}°C`}</span>
      </div>
      <p style={{ fontSize: '14px', margin: '0 0 8px', lineHeight: '1.5', color: '#1f2937' }}>{entry.work_description}</p>
      {workers.length > 0 && (
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 8px' }}>
          <b>Рабочие:</b> {workers.map((w) => `${w.name} (${w.hours}ч.)`).join(', ')}
        </p>
      )}
      {entry.notes && <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', margin: '0 0 8px' }}>{entry.notes}</p>}
      {photos.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          {photos.slice(0, 6).map((p) => (
            <img key={p.id} src={getPhotoUrl(p.storage_path)} alt="" style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '6px' }} crossOrigin="anonymous" />
          ))}
        </div>
      )}
      <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', marginTop: '16px' }} />
    </div>
  )
}
