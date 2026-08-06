/**
 * Демо-бэкенд для маркетплейса — используется, когда API_URL не задан в config.js
 * (см. api.ts). Хранит всё в localStorage этого браузера, повторяя контракт
 * настоящего api.ts один в один, чтобы хуки не знали, с каким из двух они работают.
 *
 * RLS-проверки здесь не воспроизводятся (это чистый демо-режим для одного человека
 * в одном браузере) — корректность прав доступа проверена на настоящем PostgreSQL
 * в server/.
 */
import { randomId } from './uuid'
import { notifyAuthChange } from './authEvents'
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
  SwipeDirection,
} from '../types/marketplace'

const DB_KEY = 'raznorab_api_mock_db_v1'
const SESSION_KEY = 'raznorab_api_mock_session'
const USERS_KEY = 'raznorab_api_mock_users'

interface Store {
  profiles: Profile[]
  builder_profiles: BuilderProfile[]
  orders: Order[]
  order_swipes: OrderSwipe[]
  labor_tasks: LaborTask[]
  labor_responses: LaborResponse[]
  conversations: Conversation[]
  messages: Message[]
  reports: Report[]
  banned_users: BannedUser[]
  banned_words: BannedWord[]
  admins: string[]
}

function seedStore(): Store {
  const customerId = '00000000-0000-0000-0000-0000000000c1'
  const builderId = '00000000-0000-0000-0000-0000000000b1'
  const now = new Date().toISOString()
  return {
    profiles: [
      { id: customerId, telegram_id: 900001, telegram_username: 'demo_customer', first_name: 'Ирина', last_name: 'Заказчикова', photo_url: null, phone: '+7 900 000-00-01', city: 'Москва', role: 'customer', created_at: now },
      { id: builderId, telegram_id: 900002, telegram_username: 'demo_builder', first_name: 'Игорь', last_name: 'Строителев', photo_url: null, phone: '+7 900 000-00-02', city: 'Москва', role: 'builder', created_at: now },
    ],
    builder_profiles: [
      { id: builderId, specialties: ['Плитка', 'Сантехника'], experience_years: 7, about: 'Ремонт ванных комнат под ключ, гарантия 2 года', price_from: 30000, price_to: 150000, portfolio_photos: [], is_active: true },
    ],
    orders: [
      { id: randomId(), customer_id: customerId, category: 'Плитка', title: 'Укладка плитки в ванной', description: 'Ванная 5 м², нужно снять старую плитку и положить новую, материал наш.', budget_from: 40000, budget_to: 70000, city: 'Москва', address: 'м. Тульская', photos: [], status: 'active', created_at: now },
      { id: randomId(), customer_id: customerId, category: 'Электрика', title: 'Замена проводки в квартире', description: '2-комнатная квартира, 54 м², полная замена проводки и щитка.', budget_from: 80000, budget_to: 120000, city: 'Москва', address: 'м. Юго-Западная', photos: [], status: 'active', created_at: now },
      { id: randomId(), customer_id: customerId, category: 'Отделка стен', title: 'Штукатурка и покраска стен', description: 'Требуется выровнять стены и покрасить, комната 18 м².', budget_from: 25000, budget_to: 45000, city: 'Москва', address: 'м. Бабушкинская', photos: [], status: 'active', created_at: now },
    ],
    order_swipes: [],
    conversations: [],
    messages: [],
    labor_tasks: [
      { id: randomId(), customer_id: customerId, title: 'Разгрузить машину с кирпичом', description: 'Нужно 2 человека на 2-3 часа, разгрузить газель с кирпичом.', city: 'Москва', pay_amount: 3000, pay_type: 'per_task', date_needed: null, status: 'active', created_at: now },
      { id: randomId(), customer_id: customerId, title: 'Уборка территории после ремонта', description: 'Вынести строительный мусор, подмести, вымыть окна в квартире.', city: 'Москва', pay_amount: 4000, pay_type: 'per_day', date_needed: null, status: 'active', created_at: now },
    ],
    labor_responses: [],
    reports: [],
    banned_users: [],
    banned_words: [],
    admins: [],
  }
}

function load(): Store {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw) as Store
  } catch { /* повреждённое хранилище — пересоздаём ниже */ }
  const seeded = seedStore()
  try { localStorage.setItem(DB_KEY, JSON.stringify(seeded)) } catch { /* квота хранилища */ }
  return seeded
}

const db = load()
function persist() {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)) } catch { /* квота хранилища */ }
}

function getSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY)
}
function setSessionId(id: string) {
  localStorage.setItem(SESSION_KEY, id)
  notifyAuthChange()
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  notifyAuthChange()
}
function requireSession(): string {
  const id = getSessionId()
  if (!id) throw new Error('Не авторизован')
  return id
}

interface MockUser { id: string; email: string; password: string }
function loadUsers(): MockUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') as MockUser[] } catch { return [] }
}
function saveUsers(users: MockUser[]) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)) } catch { /* квота хранилища */ }
}

const storageFiles = new Map<string, string>()
function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function findProfile(id: string): Profile {
  const p = db.profiles.find((row) => row.id === id)
  if (!p) throw new Error('Профиль не найден')
  return p
}

export const mockApi = {
  auth: {
    async register(email: string, password: string) {
      const normalized = email.trim().toLowerCase()
      const users = loadUsers()
      if (users.some((u) => u.email === normalized)) throw new Error('Такой email уже зарегистрирован')
      const id = randomId()
      users.push({ id, email: normalized, password })
      saveUsers(users)
      const profile: Profile = { id, telegram_id: null, telegram_username: null, first_name: 'Пользователь', last_name: null, photo_url: null, phone: null, city: null, role: null, created_at: new Date().toISOString() }
      db.profiles.push(profile)
      persist()
      setSessionId(id)
      return profile
    },
    async login(email: string, password: string) {
      const normalized = email.trim().toLowerCase()
      const found = loadUsers().find((u) => u.email === normalized)
      if (!found || found.password !== password) throw new Error('Неверный email или пароль')
      setSessionId(found.id)
      return findProfile(found.id)
    },
    async telegram(initData: string) {
      const params = new URLSearchParams(initData)
      const userJson = params.get('user')
      // Демо-режим тестируется без настоящего Telegram SDK (пустой initData) —
      // подставляем фиксированного тестового пользователя, как раньше делал мок SDK.
      const tgUser = userJson
        ? (JSON.parse(userJson) as { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string })
        : { id: 100000001, first_name: 'Тест', last_name: 'Пользователь', username: 'test_user' }
      let profile = db.profiles.find((p) => p.telegram_id === tgUser.id)
      if (!profile) {
        profile = {
          id: randomId(),
          telegram_id: tgUser.id,
          telegram_username: tgUser.username ?? null,
          first_name: tgUser.first_name ?? 'Пользователь',
          last_name: tgUser.last_name ?? null,
          photo_url: tgUser.photo_url ?? null,
          phone: null,
          city: null,
          role: null,
          created_at: new Date().toISOString(),
        }
        db.profiles.push(profile)
        persist()
      }
      setSessionId(profile.id)
      return profile
    },
    async me() {
      const id = getSessionId()
      if (!id) return null
      const profile = db.profiles.find((p) => p.id === id)
      return profile ?? null
    },
    logout() {
      clearSession()
    },
  },

  profiles: {
    async get(id: string) {
      return findProfile(id)
    },
    async getMany(ids: string[]) {
      const set = new Set(ids)
      return db.profiles.filter((p) => set.has(p.id))
    },
    async updateMe(patch: Partial<Pick<Profile, 'role' | 'first_name' | 'last_name' | 'phone' | 'city'>>) {
      const profile = findProfile(requireSession())
      Object.assign(profile, patch)
      persist()
      return { ...profile }
    },
  },

  builderProfiles: {
    async get(id: string) {
      return db.builder_profiles.find((b) => b.id === id) ?? null
    },
    async getMany(ids: string[]) {
      const set = new Set(ids)
      return db.builder_profiles.filter((b) => set.has(b.id))
    },
    async upsertMe(patch: Omit<BuilderProfile, 'id'>) {
      const uid = requireSession()
      const existing = db.builder_profiles.find((b) => b.id === uid)
      if (existing) {
        Object.assign(existing, patch)
        persist()
        return { ...existing }
      }
      const created: BuilderProfile = { id: uid, ...patch }
      db.builder_profiles.push(created)
      persist()
      return created
    },
  },

  orders: {
    async feed() {
      const uid = requireSession()
      const swiped = new Set(db.order_swipes.filter((s) => s.builder_id === uid).map((s) => s.order_id))
      return db.orders
        .filter((o) => o.status === 'active' && o.customer_id !== uid && !swiped.has(o.id))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
    },
    async mine() {
      const uid = requireSession()
      return db.orders.filter((o) => o.customer_id === uid).sort((a, b) => b.created_at.localeCompare(a.created_at))
    },
    async get(id: string) {
      const o = db.orders.find((row) => row.id === id)
      if (!o) throw new Error('Заказ не найден')
      return o
    },
    async create(input: Omit<Order, 'id' | 'customer_id' | 'created_at' | 'status'>) {
      const order: Order = { id: randomId(), customer_id: requireSession(), status: 'active', created_at: new Date().toISOString(), ...input }
      db.orders.push(order)
      persist()
      return order
    },
    async updateStatus(id: string, status: Order['status']) {
      const order = db.orders.find((o) => o.id === id)
      if (!order) throw new Error('Заказ не найден')
      order.status = status
      persist()
      return order
    },
    async swipe(orderId: string, direction: SwipeDirection) {
      const swipe: OrderSwipe = { id: randomId(), order_id: orderId, builder_id: requireSession(), direction, reviewed_by_customer: false, created_at: new Date().toISOString() }
      db.order_swipes.push(swipe)
      persist()
      return swipe
    },
    async candidates(orderId: string) {
      const matchedIds = new Set(db.conversations.filter((c) => c.order_id === orderId).map((c) => c.worker_id))
      return db.order_swipes
        .filter((s) => s.order_id === orderId && s.direction === 'like' && !s.reviewed_by_customer && !matchedIds.has(s.builder_id))
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((swipe) => ({
          swipe,
          profile: findProfile(swipe.builder_id),
          builderProfile: db.builder_profiles.find((b) => b.id === swipe.builder_id) ?? null,
        }))
    },
    async confirmMatch(orderId: string, builderId: string) {
      const uid = requireSession()
      const conversation: Conversation = { id: randomId(), kind: 'order', order_id: orderId, labor_task_id: null, customer_id: uid, worker_id: builderId, created_at: new Date().toISOString() }
      db.conversations.push(conversation)
      const swipe = db.order_swipes.find((s) => s.order_id === orderId && s.builder_id === builderId)
      if (swipe) swipe.reviewed_by_customer = true
      const order = db.orders.find((o) => o.id === orderId)
      if (order && order.status === 'active') order.status = 'in_progress'
      persist()
      return conversation
    },
    async rejectCandidate(orderId: string, builderId: string) {
      const swipe = db.order_swipes.find((s) => s.order_id === orderId && s.builder_id === builderId)
      if (swipe) { swipe.reviewed_by_customer = true; persist() }
    },
  },

  orderSwipes: {
    async mine() {
      const uid = requireSession()
      return db.order_swipes
        .filter((s) => s.builder_id === uid && s.direction === 'like')
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((swipe) => ({ swipe, order: db.orders.find((o) => o.id === swipe.order_id)! }))
        .filter((r) => r.order)
    },
  },

  laborTasks: {
    async feed() {
      return db.labor_tasks.filter((t) => t.status === 'active').sort((a, b) => b.created_at.localeCompare(a.created_at))
    },
    async mine() {
      const uid = requireSession()
      return db.labor_tasks.filter((t) => t.customer_id === uid).sort((a, b) => b.created_at.localeCompare(a.created_at))
    },
    async get(id: string) {
      const t = db.labor_tasks.find((row) => row.id === id)
      if (!t) throw new Error('Задача не найдена')
      return t
    },
    async create(input: Omit<LaborTask, 'id' | 'customer_id' | 'created_at' | 'status'>) {
      const task: LaborTask = { id: randomId(), customer_id: requireSession(), status: 'active', created_at: new Date().toISOString(), ...input }
      db.labor_tasks.push(task)
      persist()
      return task
    },
    async close(id: string) {
      const task = db.labor_tasks.find((t) => t.id === id)
      if (task) { task.status = 'closed'; persist() }
    },
    async responses(taskId: string) {
      return db.labor_responses
        .filter((r) => r.task_id === taskId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((response) => ({ response, profile: findProfile(response.laborer_id) }))
    },
    async accept(taskId: string, laborerId: string) {
      const uid = requireSession()
      const conversation: Conversation = { id: randomId(), kind: 'labor', order_id: null, labor_task_id: taskId, customer_id: uid, worker_id: laborerId, created_at: new Date().toISOString() }
      db.conversations.push(conversation)
      const task = db.labor_tasks.find((t) => t.id === taskId)
      if (task) task.status = 'closed'
      persist()
      return conversation
    },
  },

  laborResponses: {
    async mine() {
      const uid = requireSession()
      return db.labor_responses
        .filter((r) => r.laborer_id === uid)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((response) => ({ response, task: db.labor_tasks.find((t) => t.id === response.task_id)! }))
        .filter((r) => r.task)
    },
    async forTask(taskId: string) {
      const uid = requireSession()
      return db.labor_responses.find((r) => r.task_id === taskId && r.laborer_id === uid) ?? null
    },
    async create(taskId: string, message: string | null) {
      const response: LaborResponse = { id: randomId(), task_id: taskId, laborer_id: requireSession(), message, created_at: new Date().toISOString() }
      db.labor_responses.push(response)
      persist()
      return response
    },
  },

  conversations: {
    async list() {
      const uid = requireSession()
      const mine = db.conversations.filter((c) => c.customer_id === uid || c.worker_id === uid)
      return mine
        .map((c) => {
          const peerId = c.customer_id === uid ? c.worker_id : c.customer_id
          const peer = db.profiles.find((p) => p.id === peerId)
          const contextTitle = c.kind === 'order'
            ? db.orders.find((o) => o.id === c.order_id)?.title ?? '—'
            : db.labor_tasks.find((t) => t.id === c.labor_task_id)?.title ?? '—'
          const lastMsg = db.messages
            .filter((m) => m.conversation_id === c.id)
            .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
          return {
            ...c,
            peerName: peer ? `${peer.first_name} ${peer.last_name ?? ''}`.trim() : 'Пользователь',
            peerPhoto: peer?.photo_url ?? null,
            contextTitle,
            lastMessage: lastMsg?.text,
            lastMessageAt: lastMsg?.created_at,
          }
        })
        .sort((a, b) => (b.lastMessageAt ?? b.created_at).localeCompare(a.lastMessageAt ?? a.created_at))
    },
    async get(id: string) {
      const c = db.conversations.find((row) => row.id === id)
      if (!c) throw new Error('Чат не найден')
      return c
    },
    async messages(id: string) {
      return db.messages.filter((m) => m.conversation_id === id).sort((a, b) => a.created_at.localeCompare(b.created_at))
    },
    async sendMessage(id: string, text: string) {
      const message: Message = { id: randomId(), conversation_id: id, sender_id: requireSession(), text, created_at: new Date().toISOString() }
      db.messages.push(message)
      persist()
      return message
    },
  },

  reports: {
    async create(input: { targetType: ReportTargetType; targetId: string; reason: string; comment?: string }) {
      const report: Report = {
        id: randomId(),
        reporter_id: requireSession(),
        target_type: input.targetType,
        target_id: input.targetId,
        reason: input.reason,
        comment: input.comment ?? null,
        status: 'pending',
        created_at: new Date().toISOString(),
      }
      db.reports.push(report)
      persist()
      return report
    },
  },

  admin: {
    async check() {
      return db.admins.includes(requireSession())
    },
    async counts() {
      return {
        profiles: db.profiles.length,
        orders: db.orders.length,
        laborTasks: db.labor_tasks.length,
        pendingReports: db.reports.filter((r) => r.status === 'pending').length,
        bannedUsers: db.banned_users.length,
      }
    },
    async reports() {
      return [...db.reports].sort((a, b) => b.created_at.localeCompare(a.created_at))
    },
    async updateReportStatus(id: string, status: ReportStatus) {
      const report = db.reports.find((r) => r.id === id)
      if (report) { report.status = status; persist() }
    },
    async users(search: string) {
      const q = search.trim().toLowerCase()
      const sorted = [...db.profiles].sort((a, b) => b.created_at.localeCompare(a.created_at))
      if (!q) return sorted.slice(0, 50)
      return sorted.filter((p) =>
        p.first_name?.toLowerCase().includes(q)
        || p.last_name?.toLowerCase().includes(q)
        || p.telegram_username?.toLowerCase().includes(q)
        || p.phone?.toLowerCase().includes(q)
        || p.city?.toLowerCase().includes(q)
      )
    },
    async bannedUsers() {
      return [...db.banned_users].sort((a, b) => b.banned_at.localeCompare(a.banned_at))
    },
    async ban(profileId: string, reason: string) {
      db.banned_users = db.banned_users.filter((b) => b.profile_id !== profileId)
      db.banned_users.push({ profile_id: profileId, reason, banned_by: requireSession(), banned_at: new Date().toISOString() })
      persist()
    },
    async unban(profileId: string) {
      db.banned_users = db.banned_users.filter((b) => b.profile_id !== profileId)
      persist()
    },
    async words() {
      return [...db.banned_words].sort((a, b) => a.created_at.localeCompare(b.created_at))
    },
    async addWord(pattern: string) {
      db.banned_words.push({ id: randomId(), pattern, created_at: new Date().toISOString() })
      persist()
    },
    async deleteWord(id: string) {
      db.banned_words = db.banned_words.filter((w) => w.id !== id)
      persist()
    },
  },

  moderation: {
    async bannedWords() {
      return [...db.banned_words].sort((a, b) => a.created_at.localeCompare(b.created_at))
    },
    async myBanStatus() {
      const uid = requireSession()
      return db.banned_users.find((b) => b.profile_id === uid) ?? null
    },
  },

  uploads: {
    async upload(folder: string, file: File) {
      const dataUrl = await fileToDataUrl(file)
      const key = `${folder}/${randomId()}`
      storageFiles.set(key, dataUrl)
      return dataUrl
    },
  },
}
