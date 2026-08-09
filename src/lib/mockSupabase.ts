/**
 * Лёгкий in-memory/localStorage мок supabase-js — используется только когда
 * VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY не заданы (локальная разработка/превью
 * без реального проекта Supabase). Реализует ровно тот подмножество API, которым
 * пользуется кодовая база: from().select/insert/update/upsert/delete с eq/in/order/
 * single/maybeSingle, auth (анонимный вход + email-заглушка), storage, realtime channel.
 *
 * RLS-политики (supabase/marketplace_schema.sql) в моке НЕ применяются —
 * их корректность проверена отдельно against a real Postgres instance.
 */

import { randomId } from './uuid'

type Row = Record<string, unknown>
type Store = Record<string, Row[]>

const DB_KEY = 'raznorab_mock_db_v1'
const UID_KEY = 'raznorab_mock_auth_uid'

function uuid() {
  return randomId()
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
      { id: uuid(), customer_id: customerId, category: 'Плитка', title: 'Укладка плитки в ванной', description: 'Ванная 5 м², нужно снять старую плитку и положить новую, материал наш.', budget_from: 40000, budget_to: 70000, city: 'Москва', address: 'м. Тульская', photos: [], status: 'active', created_at: now },
      { id: uuid(), customer_id: customerId, category: 'Электрика', title: 'Замена проводки в квартире', description: '2-комнатная квартира, 54 м², полная замена проводки и щитка.', budget_from: 80000, budget_to: 120000, city: 'Москва', address: 'м. Юго-Западная', photos: [], status: 'active', created_at: now },
      { id: uuid(), customer_id: customerId, category: 'Отделка стен', title: 'Штукатурка и покраска стен', description: 'Требуется выровнять стены и покрасить, комната 18 м².', budget_from: 25000, budget_to: 45000, city: 'Москва', address: 'м. Бабушкинская', photos: [], status: 'active', created_at: now },
    ],
    order_swipes: [],
    conversations: [],
    messages: [],
    labor_tasks: [
      { id: uuid(), customer_id: customerId, title: 'Разгрузить машину с кирпичом', description: 'Нужно 2 человека на 2-3 часа, разгрузить газель с кирпичом.', city: 'Москва', pay_amount: 3000, pay_type: 'per_task', date_needed: null, status: 'active', created_at: now },
      { id: uuid(), customer_id: customerId, title: 'Уборка территории после ремонта', description: 'Вынести строительный мусор, подмести, вымыть окна в квартире.', city: 'Москва', pay_amount: 4000, pay_type: 'per_day', date_needed: null, status: 'active', created_at: now },
    ],
    labor_responses: [],
  }
}

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw) as Store
  } catch {
    // ignore corrupted storage
  }
  const seeded = seedStore()
  try { localStorage.setItem(DB_KEY, JSON.stringify(seeded)) } catch { /* ignore */ }
  return seeded
}

const db = loadStore()

function persist() {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)) } catch { /* ignore quota errors */ }
}

function table(name: string): Row[] {
  if (!db[name]) db[name] = []
  return db[name]
}

type Listener = (payload: { new: Row }) => void
interface ChannelSub { table: string; col?: string; val?: string; cb: Listener }
const channelSubs = new Map<string, ChannelSub[]>()

function notifyInsert(tableName: string, row: Row) {
  for (const subs of channelSubs.values()) {
    for (const sub of subs) {
      if (sub.table !== tableName) continue
      if (sub.col && row[sub.col] !== sub.val) continue
      sub.cb({ new: row })
    }
  }
}

class MockQueryBuilder implements PromiseLike<{ data: unknown; error: unknown }> {
  private tableName: string
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select'
  private payload: Row | Row[] | null = null
  private filters: Array<(row: Row) => boolean> = []
  private orderCol?: string
  private orderAsc = true
  private wantSingle = false
  private wantMaybeSingle = false

  constructor(tableName: string) {
    this.tableName = tableName
  }

  select() {
    return this
  }
  eq(col: string, val: unknown) {
    this.filters.push((r) => r[col] === val)
    return this
  }
  in(col: string, vals: unknown[]) {
    const set = new Set(vals)
    this.filters.push((r) => set.has(r[col] as never))
    return this
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col
    this.orderAsc = opts?.ascending ?? true
    return this
  }
  single() {
    this.wantSingle = true
    return this
  }
  maybeSingle() {
    this.wantMaybeSingle = true
    return this
  }
  insert(payload: Row | Row[]) {
    this.op = 'insert'
    this.payload = payload
    return this
  }
  update(payload: Row) {
    this.op = 'update'
    this.payload = payload
    return this
  }
  upsert(payload: Row) {
    this.op = 'upsert'
    this.payload = payload
    return this
  }
  delete() {
    this.op = 'delete'
    return this
  }

  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected)
  }

  private async exec(): Promise<{ data: unknown; error: unknown }> {
    try {
      const rows = table(this.tableName)
      let result: Row[] = []

      if (this.op === 'select') {
        result = rows.filter((r) => this.filters.every((f) => f(r)))
        if (this.orderCol) {
          const col = this.orderCol
          result = [...result].sort((a, b) => {
            const av = a[col] as string | number
            const bv = b[col] as string | number
            const cmp = av < bv ? -1 : av > bv ? 1 : 0
            return this.orderAsc ? cmp : -cmp
          })
        }
      } else if (this.op === 'insert') {
        const items = (Array.isArray(this.payload) ? this.payload : [this.payload]) as Row[]
        const inserted = items.map((item) => ({
          id: (item.id as string) ?? uuid(),
          created_at: (item.created_at as string) ?? new Date().toISOString(),
          ...item,
        }))
        rows.push(...inserted)
        persist()
        inserted.forEach((row) => notifyInsert(this.tableName, row))
        result = inserted
      } else if (this.op === 'update') {
        const matched = rows.filter((r) => this.filters.every((f) => f(r)))
        matched.forEach((r) => Object.assign(r, this.payload))
        persist()
        result = matched
      } else if (this.op === 'upsert') {
        const items = (Array.isArray(this.payload) ? this.payload : [this.payload]) as Row[]
        const results: Row[] = []
        for (const item of items) {
          const existing = item.id ? rows.find((r) => r.id === item.id) : undefined
          if (existing) {
            Object.assign(existing, item)
            results.push(existing)
          } else {
            const created = { id: uuid(), ...item }
            rows.push(created)
            results.push(created)
          }
        }
        persist()
        result = results
      } else if (this.op === 'delete') {
        const remaining: Row[] = []
        const removed: Row[] = []
        for (const r of rows) {
          if (this.filters.every((f) => f(r))) removed.push(r)
          else remaining.push(r)
        }
        db[this.tableName] = remaining
        persist()
        result = removed
      }

      // возвращаем свежие копии, а не внутренние ссылки — как реальный REST-бэкенд,
      // который каждый раз сериализует новый JSON-ответ. Иначе мутация "на месте"
      // ломает реактивность потребителей, завязанных на смену ссылки (напр. React Query).
      const output = result.map((r) => ({ ...r }))

      if (this.wantSingle) {
        if (output.length === 0) return { data: null, error: { message: 'Row not found', code: 'PGRST116' } }
        return { data: output[0], error: null }
      }
      if (this.wantMaybeSingle) {
        return { data: output[0] ?? null, error: null }
      }
      return { data: output, error: null }
    } catch (e) {
      return { data: null, error: e }
    }
  }
}

function getOrCreateUid(): string {
  let uid = localStorage.getItem(UID_KEY)
  if (!uid) {
    uid = randomId()
    localStorage.setItem(UID_KEY, uid)
  }
  return uid
}

type AuthListener = (event: string, session: unknown) => void
let authListeners: AuthListener[] = []
let currentSession: { user: { id: string; is_anonymous: boolean; email?: string } } | null = null
{
  const existingUid = typeof localStorage !== 'undefined' ? localStorage.getItem(UID_KEY) : null
  if (existingUid) currentSession = { user: { id: existingUid, is_anonymous: true } }
}

// Учётки email/пароль для демо-режима (в реальном Supabase этим занимается auth.users)
const EMAIL_USERS_KEY = 'raznorab_mock_email_users'
type MockEmailUser = { id: string; email: string; password: string }

function loadEmailUsers(): MockEmailUser[] {
  try { return JSON.parse(localStorage.getItem(EMAIL_USERS_KEY) || '[]') as MockEmailUser[] } catch { return [] }
}
function saveEmailUsers(users: MockEmailUser[]) {
  try { localStorage.setItem(EMAIL_USERS_KEY, JSON.stringify(users)) } catch { /* ignore */ }
}
function setSession(user: { id: string; is_anonymous: boolean; email?: string }) {
  currentSession = { user }
  localStorage.setItem(UID_KEY, user.id)
  authListeners.forEach((cb) => cb('SIGNED_IN', currentSession))
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

export function createMockClient() {
  return {
    auth: {
      async getSession() {
        return { data: { session: currentSession }, error: null }
      },
      async getUser() {
        return { data: { user: currentSession?.user ?? null }, error: null }
      },
      async signInAnonymously() {
        const uid = getOrCreateUid()
        currentSession = { user: { id: uid, is_anonymous: true } }
        authListeners.forEach((cb) => cb('SIGNED_IN', currentSession))
        return { data: { session: currentSession, user: currentSession.user }, error: null }
      },
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        const users = loadEmailUsers()
        const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
        if (!found || found.password !== password) {
          return { data: { session: null, user: null }, error: { message: 'Invalid login credentials' } }
        }
        setSession({ id: found.id, is_anonymous: false, email: found.email })
        return { data: { session: currentSession, user: currentSession!.user }, error: null }
      },
      async signUp({ email, password }: { email: string; password: string }) {
        const normalized = email.trim().toLowerCase()
        const users = loadEmailUsers()
        if (users.some((u) => u.email.toLowerCase() === normalized)) {
          return { data: { session: null, user: null }, error: { message: 'User already registered' } }
        }
        // если пользователь уже ходил анонимно — сохраняем его id, чтобы данные не потерялись
        const id = currentSession?.user.is_anonymous ? currentSession.user.id : randomId()
        users.push({ id, email: normalized, password })
        saveEmailUsers(users)
        setSession({ id, is_anonymous: false, email: normalized })
        return { data: { session: currentSession, user: currentSession!.user }, error: null }
      },
      async updateUser({ email, password }: { email?: string; password?: string }) {
        if (!currentSession) return { data: { user: null }, error: { message: 'Not authenticated' } }
        const users = loadEmailUsers()
        const normalized = email?.trim().toLowerCase()
        if (normalized && users.some((u) => u.email.toLowerCase() === normalized && u.id !== currentSession!.user.id)) {
          return { data: { user: null }, error: { message: 'User already registered' } }
        }
        const existing = users.find((u) => u.id === currentSession!.user.id)
        if (existing) {
          if (normalized) existing.email = normalized
          if (password) existing.password = password
        } else if (normalized && password) {
          users.push({ id: currentSession.user.id, email: normalized, password })
        }
        saveEmailUsers(users)
        setSession({ id: currentSession.user.id, is_anonymous: false, email: normalized ?? currentSession.user.email })
        return { data: { user: currentSession!.user }, error: null }
      },
      async resetPasswordForEmail() {
        return { data: {}, error: { message: 'Демо-режим: письмо для сброса пароля не отправляется' } }
      },
      async signOut() {
        currentSession = null
        localStorage.removeItem(UID_KEY)
        authListeners.forEach((cb) => cb('SIGNED_OUT', null))
        return { error: null }
      },
      onAuthStateChange(cb: AuthListener) {
        authListeners.push(cb)
        return { data: { subscription: { unsubscribe: () => { authListeners = authListeners.filter((l) => l !== cb) } } } }
      },
    },
    from(tableName: string) {
      return new MockQueryBuilder(tableName)
    },
    storage: {
      from(bucket: string) {
        return {
          async upload(path: string, file: File) {
            const dataUrl = await fileToDataUrl(file)
            storageFiles.set(`${bucket}/${path}`, dataUrl)
            return { data: { path }, error: null }
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: storageFiles.get(`${bucket}/${path}`) ?? '' } }
          },
          async remove(paths: string[]) {
            paths.forEach((p) => storageFiles.delete(`${bucket}/${p}`))
            return { data: null, error: null }
          },
        }
      },
    },
    channel(name: string) {
      const subs: ChannelSub[] = []
      channelSubs.set(name, subs)
      const channelObj = {
        on(_event: string, filterObj: { table: string; filter?: string }, cb: Listener) {
          let col: string | undefined
          let val: string | undefined
          if (filterObj.filter) {
            const match = /^(\w+)=eq\.(.+)$/.exec(filterObj.filter)
            if (match) { col = match[1]; val = match[2] }
          }
          subs.push({ table: filterObj.table, col, val, cb })
          return channelObj
        },
        subscribe(cb?: (status: string) => void) {
          cb?.('SUBSCRIBED')
          return channelObj
        },
      }
      return channelObj
    },
    removeChannel() {
      // подписки хранятся по имени канала и просто перестают получать новые события
      return Promise.resolve('ok')
    },
  }
}
