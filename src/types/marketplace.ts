export type Role = 'customer' | 'builder' | 'laborer'

export interface Profile {
  id: string
  telegram_id: number | null
  telegram_username: string | null
  first_name: string
  last_name: string | null
  photo_url: string | null
  phone: string | null
  city: string | null
  role: Role | null
  created_at: string
}

export interface BuilderProfile {
  id: string
  specialties: string[]
  experience_years: number | null
  about: string | null
  price_from: number | null
  price_to: number | null
  portfolio_photos: string[]
  is_active: boolean
}

export type OrderStatus = 'active' | 'in_progress' | 'done' | 'cancelled'

export interface Order {
  id: string
  customer_id: string
  category: string
  title: string
  description: string
  budget_from: number | null
  budget_to: number | null
  city: string | null
  address: string | null
  photos: string[]
  status: OrderStatus
  created_at: string
}

export type SwipeDirection = 'like' | 'pass'

export interface OrderSwipe {
  id: string
  order_id: string
  builder_id: string
  direction: SwipeDirection
  reviewed_by_customer: boolean
  created_at: string
}

export type ConversationKind = 'order' | 'labor'

export interface Conversation {
  id: string
  kind: ConversationKind
  order_id: string | null
  labor_task_id: string | null
  customer_id: string
  worker_id: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  text: string
  created_at: string
}

export type PayType = 'per_task' | 'per_day' | 'per_hour'

export interface LaborTask {
  id: string
  customer_id: string
  title: string
  description: string
  city: string | null
  pay_amount: number | null
  pay_type: PayType
  date_needed: string | null
  status: 'active' | 'closed'
  created_at: string
}

export interface LaborResponse {
  id: string
  task_id: string
  laborer_id: string
  message: string | null
  created_at: string
}

export const ROLE_LABELS: Record<Role, string> = {
  customer: 'Заказчик',
  builder: 'Строитель',
  laborer: 'Разнорабочий',
}

export const BUILDER_CATEGORIES = [
  'Электрика',
  'Сантехника',
  'Отделка стен',
  'Полы и стяжка',
  'Плитка',
  'Малярные работы',
  'Кровля',
  'Фундамент',
  'Кладка',
  'Сварочные работы',
  'Окна и двери',
  'Натяжные потолки',
  'Демонтаж',
  'Ландшафт и благоустройство',
  'Строительство под ключ',
  'Другое',
] as const

export const PAY_TYPE_LABELS: Record<PayType, string> = {
  per_task: 'за задачу',
  per_day: 'за день',
  per_hour: 'за час',
}
