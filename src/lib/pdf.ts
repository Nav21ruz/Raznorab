import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { ConstructionObject, Entry, EntryWorker, EntryPhoto } from '../types'
import { WEATHER_LABELS } from '../types'

interface ReportData {
  object: ConstructionObject
  entries: Array<{
    entry: Entry
    workers: EntryWorker[]
    photos: EntryPhoto[]
    photoUrls: string[]
  }>
  authorName?: string
}

export async function generatePDF(data: ReportData, elementId: string) {
  const element = document.getElementById(elementId)
  if (!element) return

  const canvas = await html2canvas(element, { scale: 2, useCORS: true })
  const imgData = canvas.toDataURL('image/png')

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let y = 0
  while (y < imgHeight) {
    if (y > 0) pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, -y, imgWidth, imgHeight)
    y += pageHeight
  }

  const filename = `Журнал_${data.object.name}_${new Date().toLocaleDateString('ru')}.pdf`
  pdf.save(filename)
}

export function formatEntryForPrint(
  entry: Entry,
  workers: EntryWorker[],
): string {
  const weather = WEATHER_LABELS[entry.weather as keyof typeof WEATHER_LABELS] ?? entry.weather
  const temp = entry.temperature != null ? `, ${entry.temperature}°C` : ''
  const workersList = workers.length
    ? workers.map((w) => `${w.name} (${w.hours} ч.)`).join(', ')
    : 'Не указаны'

  return `${weather}${temp} | Рабочие: ${workersList}`
}
