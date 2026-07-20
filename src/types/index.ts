export interface ConstructionObject {
  id: string
  user_id: string
  name: string
  address: string
  start_date: string
  description: string | null
  created_at: string
}

export interface Entry {
  id: string
  object_id: string
  date: string
  weather: string
  temperature: number | null
  work_description: string
  notes: string | null
  created_at: string
}

export interface EntryWorker {
  id: string
  entry_id: string
  name: string
  hours: number
}

export interface EntryPhoto {
  id: string
  entry_id: string
  storage_path: string
  caption: string | null
}

export interface ShareToken {
  id: string
  object_id: string
  token: string
  expires_at: string | null
}

export type Weather = 'sunny' | 'cloudy' | 'rain' | 'snow' | 'frost' | 'windy'

export const WEATHER_LABELS: Record<Weather, string> = {
  sunny: '☀️ Ясно',
  cloudy: '☁️ Облачно',
  rain: '🌧️ Дождь',
  snow: '❄️ Снег',
  frost: '🥶 Мороз',
  windy: '💨 Ветер',
}

export interface Expense {
  id: string
  object_id: string
  date: string
  amount: number
  category: ExpenseCategory
  description: string | null
  source: 'web' | 'bot'
  created_at: string
}

export type ExpenseCategory =
  | 'materials'
  | 'tools'
  | 'transport'
  | 'rent'
  | 'utilities'
  | 'food'
  | 'other'

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  materials: '🧱 Материалы',
  tools: '🛠 Инструменты',
  transport: '🚚 Транспорт',
  rent: '🏠 Аренда',
  utilities: '💡 Коммунальные',
  food: '🍽 Питание',
  other: '📦 Прочее',
}

export interface Shift {
  id: string
  object_id: string
  worker_name: string
  date: string
  amount: number
  hours: number | null
  paid: boolean
  notes: string | null
  source: 'web' | 'bot'
  created_at: string
}

export interface TelegramLink {
  id: string
  telegram_user_id: number
  telegram_chat_id: number
  user_id: string
  current_object_id: string | null
  linked_at: string
}

export interface TelegramLinkCode {
  id: string
  code: string
  user_id: string
  expires_at: string
  used_at: string | null
  created_at: string
}
