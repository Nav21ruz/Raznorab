export function formatMoney(n: number): string {
  return `${n.toLocaleString('ru-RU')} ₽`
}

export function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

/** Достаёт первое число из строки (поддерживает "4 500", "4500,50", "4500.5") */
export function extractAmount(text: string): number | null {
  const match = text.replace(/\s+/g, ' ').match(/(\d[\d\s]*)(?:[.,](\d{1,2}))?/)
  if (!match) return null
  const whole = match[1].replace(/\s/g, '')
  const fraction = match[2]
  const value = Number(fraction ? `${whole}.${fraction}` : whole)
  return Number.isFinite(value) && value > 0 ? value : null
}

/** Убирает найденное число из текста, оставляя остальное как описание */
export function stripAmount(text: string): string {
  return text.replace(/\d[\d\s]*(?:[.,]\d{1,2})?/, '').replace(/\s+/g, ' ').trim()
}

/** Ищет дату вида dd.mm или dd.mm.yyyy в тексте */
export function extractDate(text: string): string | null {
  const match = text.match(/(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/)
  if (!match) return null
  const [, d, m, y] = match
  const year = y ? (y.length === 2 ? `20${y}` : y) : new Date().getFullYear().toString()
  const day = d.padStart(2, '0')
  const month = m.padStart(2, '0')
  return `${year}-${month}-${day}`
}
