import Anthropic from '@anthropic-ai/sdk'
import { env } from './env.js'
import type { ExpenseCategory } from './types.js'

const client = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null

export type ParsedEntry =
  | { type: 'expense'; amount: number; category: ExpenseCategory; description: string | null; date: string }
  | { type: 'shift'; workerName: string; amount: number; hours: number | null; date: string }
  | { type: 'unclear' }

const EXPENSE_CATEGORIES: ExpenseCategory[] = ['materials', 'tools', 'transport', 'rent', 'utilities', 'food', 'other']

const TOOL_NAME = 'record_finance_entry'

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

export async function parseFinanceMessage(text: string): Promise<ParsedEntry | null> {
  if (!client) return null

  const today = todayIso()

  const response = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 300,
    system:
      `Ты помогаешь прорабу вести учёт расходов на стройобъекте по сообщениям в Telegram. ` +
      `Сегодняшняя дата: ${today}. Определи, о чём сообщение: о покупке/расходе (expense) ` +
      `или о выплате/смене рабочего (shift). Если сообщение не про деньги или сумму невозможно ` +
      `определить — верни type "unclear". Дату указывай в формате YYYY-MM-DD, если в тексте есть ` +
      `явное указание ("вчера", "3 июля" и т.п.), иначе используй сегодняшнюю дату.`,
    messages: [{ role: 'user', content: text }],
    tools: [
      {
        name: TOOL_NAME,
        description: 'Записать распознанную финансовую операцию',
        input_schema: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['expense', 'shift', 'unclear'] },
            amount: { type: 'number', description: 'Сумма в рублях' },
            category: { type: 'string', enum: EXPENSE_CATEGORIES, description: 'Только для expense' },
            description: { type: 'string', description: 'Краткое описание покупки, только для expense' },
            worker_name: { type: 'string', description: 'Имя рабочего, только для shift' },
            hours: { type: 'number', description: 'Часы смены, только для shift, если указаны' },
            date: { type: 'string', description: 'YYYY-MM-DD' },
          },
          required: ['type'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: TOOL_NAME },
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') return null

  const input = toolUse.input as {
    type: string
    amount?: number
    category?: string
    description?: string
    worker_name?: string
    hours?: number
    date?: string
  }

  const date = input.date && /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? input.date : today

  if (input.type === 'expense' && typeof input.amount === 'number' && input.amount > 0) {
    const category = EXPENSE_CATEGORIES.includes(input.category as ExpenseCategory)
      ? (input.category as ExpenseCategory)
      : 'other'
    return { type: 'expense', amount: input.amount, category, description: input.description ?? null, date }
  }

  if (input.type === 'shift' && typeof input.amount === 'number' && input.worker_name) {
    return { type: 'shift', workerName: input.worker_name, amount: input.amount, hours: input.hours ?? null, date }
  }

  return { type: 'unclear' }
}
