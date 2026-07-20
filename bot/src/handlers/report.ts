import { Markup } from 'telegraf'
import type { Telegraf } from 'telegraf'
import type { BotContext } from '../context.js'
import { getOwnedObject, requireLink } from '../lib/auth.js'
import { supabase } from '../supabase.js'
import { formatMoney } from '../lib/format.js'
import { EXPENSE_CATEGORY_LABELS, type Expense, type Shift } from '../types.js'

type Period = 'today' | 'week' | 'month' | 'all'

const PERIOD_LABELS: Record<Period, string> = {
  today: 'сегодня',
  week: 'неделю',
  month: 'месяц',
  all: 'всё время',
}

function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function periodStart(period: Period): string | null {
  const today = new Date().toISOString().split('T')[0]
  if (period === 'today') return today
  if (period === 'week') return daysAgoIso(6)
  if (period === 'month') {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
  }
  return null
}

export function registerReportHandlers(bot: Telegraf<BotContext>): void {
  bot.action('open_report', async (ctx) => {
    await ctx.answerCbQuery()
    const link = await requireLink(ctx)
    if (!link) return
    if (!link.current_object_id) {
      await ctx.reply('Сначала выберите объект: /objects')
      return
    }
    await ctx.reply(
      'За какой период?',
      Markup.inlineKeyboard([
        [Markup.button.callback('Сегодня', 'report:today'), Markup.button.callback('Неделя', 'report:week')],
        [Markup.button.callback('Месяц', 'report:month'), Markup.button.callback('Всё время', 'report:all')],
      ]),
    )
  })

  bot.action(/^report:(today|week|month|all)$/, async (ctx) => {
    await ctx.answerCbQuery()
    const period = ctx.match[1] as Period
    const link = await requireLink(ctx)
    if (!link || !link.current_object_id) return

    const obj = await getOwnedObject(link.user_id, link.current_object_id)
    if (!obj) return

    const from = periodStart(period)

    let expenseQuery = supabase.from('expenses').select('*').eq('object_id', obj.id)
    let shiftQuery = supabase.from('shifts').select('*').eq('object_id', obj.id)
    if (from) {
      expenseQuery = expenseQuery.gte('date', from)
      shiftQuery = shiftQuery.gte('date', from)
    }

    const [{ data: expenses }, { data: shifts }] = await Promise.all([expenseQuery, shiftQuery])

    await ctx.reply(buildReport(obj.name, period, (expenses as Expense[]) ?? [], (shifts as Shift[]) ?? []))
  })
}

function buildReport(objectName: string, period: Period, expenses: Expense[], shifts: Shift[]): string {
  const lines = [`📊 Отчёт по «${objectName}» за ${PERIOD_LABELS[period]}`, '']

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalShifts = shifts.reduce((s, sh) => s + Number(sh.amount), 0)

  lines.push(`💰 Расходы: ${formatMoney(totalExpenses)}`)
  if (expenses.length > 0) {
    const byCategory = new Map<string, number>()
    for (const e of expenses) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + Number(e.amount))
    for (const [category, sum] of byCategory) {
      lines.push(`  ${EXPENSE_CATEGORY_LABELS[category as keyof typeof EXPENSE_CATEGORY_LABELS] ?? category}: ${formatMoney(sum)}`)
    }
  }

  lines.push('', `👷 Выплаты рабочим: ${formatMoney(totalShifts)}`)
  if (shifts.length > 0) {
    const byWorker = new Map<string, { sum: number; count: number }>()
    for (const s of shifts) {
      const entry = byWorker.get(s.worker_name) ?? { sum: 0, count: 0 }
      entry.sum += Number(s.amount)
      entry.count += 1
      byWorker.set(s.worker_name, entry)
    }
    for (const [worker, { sum, count }] of byWorker) {
      lines.push(`  ${worker}: ${formatMoney(sum)} (${count} см.)`)
    }
    const unpaid = shifts.filter((s) => !s.paid).reduce((s, sh) => s + Number(sh.amount), 0)
    if (unpaid > 0) lines.push(`  Не выплачено: ${formatMoney(unpaid)}`)
  }

  lines.push('', `ИТОГО: ${formatMoney(totalExpenses + totalShifts)}`)

  if (expenses.length === 0 && shifts.length === 0) {
    lines.push('', 'Пока нет данных за этот период.')
  }

  return lines.join('\n')
}
