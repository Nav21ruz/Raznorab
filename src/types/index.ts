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
