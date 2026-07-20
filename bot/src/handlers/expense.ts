import { Markup } from 'telegraf'
import type { Telegraf } from 'telegraf'
import type { BotContext } from '../context.js'
import { requireLink } from '../lib/auth.js'
import { supabase } from '../supabase.js'
import { clearWizard, getWizard, setWizard } from '../session.js'
import { extractAmount, extractDate, formatDate, formatMoney, stripAmount, todayIso } from '../lib/format.js'
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '../types.js'
import { showMainMenu } from './menu.js'

export async function startExpenseWizard(ctx: BotContext): Promise<void> {
  const link = await requireLink(ctx)
  if (!link) return

  if (!link.current_object_id) {
    await ctx.reply('Сначала выберите объект: /objects')
    return
  }

  setWizard(ctx.chat!.id, { step: 'expense_category' })
  await ctx.reply(
    'Категория расхода:',
    Markup.inlineKeyboard(
      Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => [Markup.button.callback(label, `expense_cat:${key}`)]),
    ),
  )
}

export async function renderExpenseConfirm(
  ctx: BotContext,
  data: { amount: number; category: ExpenseCategory; description: string | null; date: string },
): Promise<void> {
  setWizard(ctx.chat!.id, { step: 'expense_confirm', ...data })
  const lines = [
    '💰 Новый расход',
    `Сумма: ${formatMoney(data.amount)}`,
    `Категория: ${EXPENSE_CATEGORY_LABELS[data.category]}`,
    `Дата: ${formatDate(data.date)}`,
  ]
  if (data.description) lines.push(`Описание: ${data.description}`)

  await ctx.reply(
    lines.join('\n'),
    Markup.inlineKeyboard([
      [Markup.button.callback('✅ Сохранить', 'expense_save'), Markup.button.callback('❌ Отмена', 'expense_cancel')],
    ]),
  )
}

export async function handleExpenseDetailsText(ctx: BotContext, category: ExpenseCategory, text: string): Promise<void> {
  const amount = extractAmount(text)
  if (!amount) {
    await ctx.reply('Не нашёл сумму. Напишите, например: «4500 цемент 5 мешков»')
    return
  }
  const description = stripAmount(text) || null
  const date = extractDate(text) ?? todayIso()
  await renderExpenseConfirm(ctx, { amount, category, description, date })
}

export function registerExpenseHandlers(bot: Telegraf<BotContext>): void {
  bot.action('add_expense', async (ctx) => {
    await ctx.answerCbQuery()
    await startExpenseWizard(ctx)
  })

  bot.action(/^expense_cat:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery()
    const category = ctx.match[1] as ExpenseCategory
    setWizard(ctx.chat!.id, { step: 'expense_details', category })
    await ctx.reply('Сумма и краткое описание одним сообщением, например: «4500 цемент 5 мешков»')
  })

  bot.action('expense_save', async (ctx) => {
    await ctx.answerCbQuery()
    const link = await requireLink(ctx)
    const wizard = getWizard(ctx.chat!.id)
    if (!link || !wizard || wizard.step !== 'expense_confirm' || !link.current_object_id) {
      await ctx.reply('Сессия истекла, начните заново: /menu')
      return
    }

    const { error } = await supabase.from('expenses').insert({
      object_id: link.current_object_id,
      amount: wizard.amount,
      category: wizard.category,
      description: wizard.description,
      date: wizard.date,
      source: 'bot',
    })

    clearWizard(ctx.chat!.id)
    if (error) {
      await ctx.reply('Не удалось сохранить расход. Попробуйте ещё раз.')
      return
    }
    await ctx.reply(`✅ Сохранено: ${formatMoney(wizard.amount)}`)
    await showMainMenu(ctx)
  })

  bot.action('expense_cancel', async (ctx) => {
    await ctx.answerCbQuery()
    clearWizard(ctx.chat!.id)
    await ctx.reply('Отменено.')
    await showMainMenu(ctx)
  })
}
