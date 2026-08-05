import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createMockClient } from './mockSupabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const isMockBackend = !supabaseUrl || !supabaseAnonKey

if (isMockBackend) {
  console.warn(
    '[raznorab] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY не заданы — используется локальный демо-бэкенд ' +
    '(данные хранятся только в этом браузере). Укажите переменные окружения, чтобы подключить реальный Supabase.'
  )
}

export const supabase: SupabaseClient = isMockBackend
  ? (createMockClient() as unknown as SupabaseClient)
  : createClient(supabaseUrl, supabaseAnonKey)
