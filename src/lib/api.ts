import type {
  BannedUser,
  BannedWord,
  BuilderProfile,
  Conversation,
  LaborResponse,
  LaborTask,
  Message,
  Order,
  OrderSwipe,
  Profile,
  Report,
  ReportStatus,
  ReportTargetType,
  Role,
  SwipeDirection,
} from '../types/marketplace'
import { mockApi } from './mockApi'
import { notifyAuthChange, onAuthChange } from './authEvents'

declare global {
  interface Window {
    __APP_CONFIG__?: { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string; API_URL?: string }
  }
}

/**
 * Настройки читаются из public/config.js (правится прямо на хостинге, без
 * пересборки) — так же, как раньше для Supabase. Если API_URL не задан,
 * приложение работает в демо-режиме на локальном моке (см. mockApi.ts).
 */
const runtimeConfig = typeof window !== 'undefined' ? window.__APP_CONFIG__ : undefined
const API_URL = (runtimeConfig?.API_URL || import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '')

export const isMockBackend = !API_URL

if (isMockBackend) {
  console.warn(
    '[raznorab] API-сервер не настроен — используется локальный демо-бэкенд ' +
    '(данные хранятся только в этом браузере). Заполните API_URL в файле config.js рядом с index.html.'
  )
}

const TOKEN_KEY = 'raznorab_api_token'

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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> | undefined) }
  if (options.body) headers['content-type'] = 'application/json'
  if (token) headers['authorization'] = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('Нет связи с сервером. Проверьте подключение к интернету.')
  }
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера')
  return data as T
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
    async telegram(initData: string) {
      const r = await request<{ token: string; profile: Profile }>('/auth/telegram', {
        method: 'POST',
        body: JSON.stringify({ initData }),
      })
      setToken(r.token)
      return r.profile
    },
    async me() {
      if (!getToken()) return null
      try {
        const r = await request<{ profile: Profile }>('/auth/me')
        return r.profile
      } catch {
        clearToken()
        return null
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
    async feed() {
      const r = await request<{ orders: Order[] }>('/orders/feed')
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
    async feed() {
      const r = await request<{ tasks: LaborTask[] }>('/labor-tasks/feed')
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
        conversations: (Conversation & { peerName: string; peerPhoto: string | null; contextTitle: string; lastMessage?: string; lastMessageAt?: string })[]
      }>('/conversations')
      return r.conversations
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
