import type {
  BannedUser,
  BannedWord,
  BuilderProfile,
  Conversation,
  LaborFeedFilters,
  LaborResponse,
  LaborTask,
  Message,
  NotificationsSummary,
  Order,
  OrderFeedFilters,
  OrderSwipe,
  Profile,
  Report,
  ReportStatus,
  ReportTargetType,
  Review,
  Role,
  SwipeDirection,
} from '../types/marketplace'
import { mockApi } from './mockApi'
import { notifyAuthChange, onAuthChange } from './authEvents'
import { randomId } from './uuid'

declare global {
  interface Window {
    __APP_CONFIG__?: { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string; API_URL?: string; YANDEX_CLIENT_ID?: string }
  }
}

/**
 * Настройки читаются из public/config.js (правится прямо на хостинге, без
 * пересборки) — так же, как раньше для Supabase. Если API_URL не задан,
 * приложение работает в демо-режиме на локальном моке (см. mockApi.ts).
 */
const runtimeConfig = typeof window !== 'undefined' ? window.__APP_CONFIG__ : undefined
const API_URL = (runtimeConfig?.API_URL || import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '')
const YANDEX_CLIENT_ID = (runtimeConfig?.YANDEX_CLIENT_ID || import.meta.env.VITE_YANDEX_CLIENT_ID || '').trim()

export const isMockBackend = !API_URL
// Настоящий OAuth Яндекса нельзя осмысленно показать в демо-режиме (нет
// реального сервера для обмена кода), поэтому кнопка появляется только когда
// задан и сервер, и client_id приложения в Яндексе.
export const yandexLoginAvailable = !isMockBackend && !!YANDEX_CLIENT_ID

if (isMockBackend) {
  console.warn(
    '[raznorab] API-сервер не настроен — используется локальный демо-бэкенд ' +
    '(данные хранятся только в этом браузере). Заполните API_URL в файле config.js рядом с index.html.'
  )
}

const TOKEN_KEY = 'raznorab_api_token'
const YANDEX_STATE_KEY = 'raznorab_yandex_oauth_state'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
  notifyAuthChange()
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  notifyAuthChange()
}
export { onAuthChange }

/** status отсутствует при сетевой ошибке (сервер недоступен) — отличаем от
 * настоящего отказа сервера (401 и т.д.), где сервер точно ответил "нет". */
export class ApiRequestError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> | undefined) }
  if (options.body) headers['content-type'] = 'application/json'
  if (token) headers['authorization'] = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new ApiRequestError('Нет связи с сервером. Проверьте подключение к интернету.')
  }
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiRequestError(data.error || 'Ошибка сервера', res.status)
  return data as T
}

/** Собирает "?a=1&b=2" из объекта фильтров, пропуская пустые/неопределённые поля. */
function buildQuery(filters?: object): string {
  if (!filters) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === '') continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

const realApi = {
  auth: {
    async register(email: string, password: string) {
      const r = await request<{ token: string; profile: Profile }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setToken(r.token)
      return r.profile
    },
    async login(email: string, password: string) {
      const r = await request<{ token: string; profile: Profile }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setToken(r.token)
      return r.profile
    },
    /** Строит ссылку на страницу входа Яндекса и запоминает одноразовый state
     * (защита от CSRF — без него кто угодно мог бы прислать чужой код входа). */
    buildYandexAuthorizeUrl() {
      const state = randomId()
      sessionStorage.setItem(YANDEX_STATE_KEY, state)
      const redirectUri = `${window.location.origin}/auth/yandex/callback`
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: YANDEX_CLIENT_ID,
        redirect_uri: redirectUri,
        state,
      })
      return `https://oauth.yandex.ru/authorize?${params.toString()}`
    },
    async yandex(code: string, state: string) {
      const expected = sessionStorage.getItem(YANDEX_STATE_KEY)
      sessionStorage.removeItem(YANDEX_STATE_KEY)
      if (!expected || expected !== state) {
        throw new Error('Не удалось подтвердить вход через Яндекс — попробуйте ещё раз')
      }
      const r = await request<{ token: string; profile: Profile }>('/auth/yandex', {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
      setToken(r.token)
      return r.profile
    },
    async forgotPassword(email: string) {
      await request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
    },
    async resetPassword(token: string, password: string) {
      await request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) })
    },
    async me() {
      if (!getToken()) return null
      try {
        const r = await request<{ profile: Profile }>('/auth/me')
        return r.profile
      } catch (e) {
        // Разлогиниваем только если сервер ЯВНО сказал "токен недействителен" (401).
        // Сетевой сбой или временная недоступность сервера — не повод молча выкинуть
        // человека из аккаунта; пусть останется как есть и попробует ещё раз.
        if (e instanceof ApiRequestError && e.status === 401) {
          clearToken()
          return null
        }
        throw e
      }
    },
    logout() {
      clearToken()
    },
  },

  profiles: {
    async get(id: string) {
      const r = await request<{ profile: Profile }>(`/profiles/${id}`)
      return r.profile
    },
    async getMany(ids: string[]) {
      if (!ids.length) return []
      const r = await request<{ profiles: Profile[] }>(`/profiles?ids=${ids.join(',')}`)
      return r.profiles
    },
    async updateMe(patch: Partial<Pick<Profile, 'role' | 'first_name' | 'last_name' | 'phone' | 'city'>>) {
      const r = await request<{ profile: Profile }>('/profiles/me', { method: 'PATCH', body: JSON.stringify(patch) })
      return r.profile
    },
  },

  builderProfiles: {
    async get(id: string) {
      const r = await request<{ builderProfile: BuilderProfile | null }>(`/builder-profiles/${id}`)
      return r.builderProfile
    },
    async getMany(ids: string[]) {
      if (!ids.length) return []
      const r = await request<{ builderProfiles: BuilderProfile[] }>(`/builder-profiles?ids=${ids.join(',')}`)
      return r.builderProfiles
    },
    async upsertMe(patch: Omit<BuilderProfile, 'id'>) {
      const r = await request<{ builderProfile: BuilderProfile }>('/builder-profiles/me', {
        method: 'PUT',
        body: JSON.stringify(patch),
      })
      return r.builderProfile
    },
  },

  orders: {
    async feed(filters?: OrderFeedFilters) {
      const qs = buildQuery(filters)
      const r = await request<{ orders: Order[] }>(`/orders/feed${qs}`)
      return r.orders
    },
    async mine() {
      const r = await request<{ orders: Order[] }>('/orders/mine')
      return r.orders
    },
    async get(id: string) {
      const r = await request<{ order: Order }>(`/orders/${id}`)
      return r.order
    },
    async create(input: Omit<Order, 'id' | 'customer_id' | 'created_at' | 'status'>) {
      const r = await request<{ order: Order }>('/orders', { method: 'POST', body: JSON.stringify(input) })
      return r.order
    },
    async updateStatus(id: string, status: Order['status']) {
      const r = await request<{ order: Order }>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      return r.order
    },
    async swipe(orderId: string, direction: SwipeDirection) {
      const r = await request<{ swipe: OrderSwipe }>(`/orders/${orderId}/swipe`, {
        method: 'POST',
        body: JSON.stringify({ direction }),
      })
      return r.swipe
    },
    async candidates(orderId: string) {
      const r = await request<{ candidates: { swipe: OrderSwipe; profile: Profile; builderProfile: BuilderProfile | null }[] }>(
        `/orders/${orderId}/candidates`
      )
      return r.candidates
    },
    async confirmMatch(orderId: string, builderId: string) {
      const r = await request<{ conversation: Conversation }>(`/orders/${orderId}/confirm-match`, {
        method: 'POST',
        body: JSON.stringify({ builder_id: builderId }),
      })
      return r.conversation
    },
    async rejectCandidate(orderId: string, builderId: string) {
      await request(`/orders/${orderId}/reject-candidate`, { method: 'POST', body: JSON.stringify({ builder_id: builderId }) })
    },
  },

  orderSwipes: {
    async mine() {
      const r = await request<{ responses: { swipe: OrderSwipe; order: Order }[] }>('/order-swipes/mine')
      return r.responses
    },
  },

  laborTasks: {
    async feed(filters?: LaborFeedFilters) {
      const qs = buildQuery(filters)
      const r = await request<{ tasks: LaborTask[] }>(`/labor-tasks/feed${qs}`)
      return r.tasks
    },
    async mine() {
      const r = await request<{ tasks: LaborTask[] }>('/labor-tasks/mine')
      return r.tasks
    },
    async get(id: string) {
      const r = await request<{ task: LaborTask }>(`/labor-tasks/${id}`)
      return r.task
    },
    async create(input: Omit<LaborTask, 'id' | 'customer_id' | 'created_at' | 'status'>) {
      const r = await request<{ task: LaborTask }>('/labor-tasks', { method: 'POST', body: JSON.stringify(input) })
      return r.task
    },
    async close(id: string) {
      await request(`/labor-tasks/${id}/close`, { method: 'PATCH' })
    },
    async responses(taskId: string) {
      const r = await request<{ responses: { response: LaborResponse; profile: Profile }[] }>(`/labor-tasks/${taskId}/responses`)
      return r.responses
    },
    async markResponsesSeen(taskId: string) {
      await request(`/labor-tasks/${taskId}/responses/seen`, { method: 'PATCH' })
    },
    async accept(taskId: string, laborerId: string) {
      const r = await request<{ conversation: Conversation }>(`/labor-tasks/${taskId}/accept`, {
        method: 'POST',
        body: JSON.stringify({ laborer_id: laborerId }),
      })
      return r.conversation
    },
  },

  laborResponses: {
    async mine() {
      const r = await request<{ responses: { response: LaborResponse; task: LaborTask }[] }>('/labor-responses/mine')
      return r.responses
    },
    async forTask(taskId: string) {
      const r = await request<{ response: LaborResponse | null }>(`/labor-responses/for-task/${taskId}`)
      return r.response
    },
    async create(taskId: string, message: string | null) {
      const r = await request<{ response: LaborResponse }>('/labor-responses', {
        method: 'POST',
        body: JSON.stringify({ task_id: taskId, message }),
      })
      return r.response
    },
  },

  conversations: {
    async list() {
      const r = await request<{
        conversations: (Conversation & { peerName: string; peerPhoto: string | null; contextTitle: string; lastMessage?: string; lastMessageAt?: string; unreadCount: number })[]
      }>('/conversations')
      return r.conversations
    },
    async markRead(id: string) {
      await request(`/conversations/${id}/read`, { method: 'POST' })
    },
    async get(id: string) {
      const r = await request<{ conversation: Conversation }>(`/conversations/${id}`)
      return r.conversation
    },
    async messages(id: string) {
      const r = await request<{ messages: Message[] }>(`/conversations/${id}/messages`)
      return r.messages
    },
    async sendMessage(id: string, text: string) {
      const r = await request<{ message: Message }>(`/conversations/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
      return r.message
    },
    async myReview(id: string) {
      const r = await request<{ review: Review | null }>(`/conversations/${id}/my-review`)
      return r.review
    },
    async createReview(id: string, rating: number, comment?: string) {
      const r = await request<{ review: Review }>(`/conversations/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
      })
      return r.review
    },
  },

  reviews: {
    async forProfile(profileId: string) {
      return request<{ reviews: (Review & { reviewerName: string; reviewerPhoto: string | null })[]; average: number | null; count: number }>(
        `/profiles/${profileId}/reviews`
      )
    },
  },

  notifications: {
    async summary() {
      return request<NotificationsSummary>('/notifications/summary')
    },
  },

  reports: {
    async create(input: { targetType: ReportTargetType; targetId: string; reason: string; comment?: string }) {
      const r = await request<{ report: Report }>('/reports', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return r.report
    },
  },

  admin: {
    async check() {
      const r = await request<{ isAdmin: boolean }>('/admin/check')
      return r.isAdmin
    },
    async counts() {
      return request<{ profiles: number; orders: number; laborTasks: number; pendingReports: number; bannedUsers: number }>('/admin/counts')
    },
    async reports() {
      const r = await request<{ reports: Report[] }>('/admin/reports')
      return r.reports
    },
    async updateReportStatus(id: string, status: ReportStatus) {
      await request(`/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    },
    async users(search: string) {
      const r = await request<{ profiles: Profile[] }>(`/admin/users?search=${encodeURIComponent(search)}`)
      return r.profiles
    },
    async bannedUsers() {
      const r = await request<{ bannedUsers: BannedUser[] }>('/admin/banned-users')
      return r.bannedUsers
    },
    async ban(profileId: string, reason: string) {
      await request(`/admin/users/${profileId}/ban`, { method: 'POST', body: JSON.stringify({ reason }) })
    },
    async unban(profileId: string) {
      await request(`/admin/users/${profileId}/ban`, { method: 'DELETE' })
    },
    async words() {
      const r = await request<{ words: BannedWord[] }>('/admin/words')
      return r.words
    },
    async addWord(pattern: string) {
      await request('/admin/words', { method: 'POST', body: JSON.stringify({ pattern }) })
    },
    async deleteWord(id: string) {
      await request(`/admin/words/${id}`, { method: 'DELETE' })
    },
  },

  moderation: {
    async bannedWords() {
      const r = await request<{ words: BannedWord[] }>('/banned-words')
      return r.words
    },
    async myBanStatus() {
      const r = await request<{ ban: BannedUser | null }>('/moderation/my-ban-status')
      return r.ban
    },
  },

  uploads: {
    /** Возвращает публичную ссылку на загруженный файл. Сам файл уходит напрямую
     * в Object Storage по временной подписанной ссылке, минуя наш сервер. */
    async upload(folder: 'orders' | 'builder-portfolio', file: File) {
      const { uploadUrl, publicUrl } = await request<{ uploadUrl: string; publicUrl: string }>('/uploads/sign', {
        method: 'POST',
        body: JSON.stringify({ folder, contentType: file.type }),
      })
      const putRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'content-type': file.type }, body: file })
      if (!putRes.ok) throw new Error('Не удалось загрузить фото')
      return publicUrl
    },
  },
}

export type Api = typeof realApi
export const api: Api = isMockBackend ? mockApi : realApi
export type { Role }
