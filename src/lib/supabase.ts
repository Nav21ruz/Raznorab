import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createMockClient } from './mockSupabase'

declare global {
  interface Window {
    // Полная форма объявлена здесь и в lib/api.ts — оба поля читает Журнал объекта
    // (Supabase), API_URL — Стройбиржа (свой сервер). Типы должны совпадать дословно,
    // иначе TypeScript не сможет объединить два declare global для одного Window.
    __APP_CONFIG__?: { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string; API_URL?: string }
  }
}

/**
 * Настройки берём сначала из public/config.js (читается при запуске страницы),
 * потом из переменных сборки. Первый вариант позволяет менять ключи прямо на
 * хостинге, без пересборки проекта — это важно для обычного shared-хостинга.
 */
const runtimeConfig = typeof window !== 'undefined' ? window.__APP_CONFIG__ : undefined

const supabaseUrl = (runtimeConfig?.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = (runtimeConfig?.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const isMockBackend = !supabaseUrl || !supabaseAnonKey

if (isMockBackend) {
  console.warn(
    '[raznorab] Supabase не настроен — используется локальный демо-бэкенд ' +
    '(данные хранятся только в этом браузере). Заполните SUPABASE_URL и ' +
    'SUPABASE_ANON_KEY в файле config.js рядом с index.html.'
  )
}

export const supabase: SupabaseClient = isMockBackend
  ? (createMockClient() as unknown as SupabaseClient)
  : createClient(supabaseUrl, supabaseAnonKey)
