import { Markup } from 'telegraf'
import type { Telegraf } from 'telegraf'
import type { BotContext } from '../context.js'
import { requireLink } from '../lib/auth.js'
import { supabase } from '../supabase.js'
import { clearWizard, getWizard, setWizard } from '../session.js'
import { extractAmount, extractDate, formatDate, formatMoney, stripAmount, todayIso } from '../lib/format.js'
import { showMainMenu } from './menu.js'

export async function startShiftWizard(ctx: BotContext): Promise<void> {
  const link = await requireLink(ctx)
  if (!link) return

  if (!link.current_object_id) {
    await ctx.reply('Сначала выберите объект: /objects')
    return
  }

  setWizard(ctx.chat!.id, { step: 'shift_worker' })
  await ctx.reply('Имя рабочего:')
}

export async function renderShiftConfirm(
  ctx: BotContext,
  data: { workerName: string; amount: number; hours: number | null; date: string },
): Promise<void> {
  setWizard(ctx.chat!.id, { step: 'shift_confirm', ...data })
  const lines = [
    '👷 Новая смена',
    `Рабочий: ${data.workerName}`,
    `Сумма: ${formatMoney(data.amount)}`,
    `Дата: ${formatDate(data.date)}`,
  ]
  if (data.hours != null) lines.push(`Часы: ${data.hours}`)

  await ctx.reply(
    lines.join('\n'),
    Markup.inlineKeyboard([
      [Markup.button.callback('✅ Сохранить', 'shift_save'), Markup.button.callback('❌ Отмена', 'shift_cancel')],
    ]),
  )
}

export async function handleShiftWorkerText(ctx: BotContext, workerName: string): Promise<void> {
  const name = workerName.trim()
  if (!name) {
    await ctx.reply('Введите имя рабочего:')
    return
  }
  setWizard(ctx.chat!.id, { step: 'shift_details', workerName: name })
  await ctx.reply('Сумма за смену и дата (необязательно), например: «2500» или «2500 19.07»')
}

export async function handleShiftDetailsText(ctx: BotContext, workerName: string, text: string): Promise<void> {
  const amount = extractAmount(text)
  if (!amount) {
    await ctx.reply('Не нашёл сумму. Напишите, например: «2500» или «2500 19.07»')
    return
  }
  const date = extractDate(text) ?? todayIso()
  const remainder = stripAmount(text).replace(/\d{1,2}\.\d{1,2}(\.\d{2,4})?/, '').trim()
  const hoursMatch = remainder.match(/(\d+(?:[.,]\d+)?)\s*ч/)
  const hours = hoursMatch ? Number(hoursMatch[1].replace(',', '.')) : null

  await renderShiftConfirm(ctx, { workerName, amount, hours, date })
}

export function registerShiftHandlers(bot: Telegraf<BotContext>): void {
  bot.action('add_shift', async (ctx) => {
    await ctx.answerCbQuery()
    await startShiftWizard(ctx)
  })

  bot.action('shift_save', async (ctx) => {
    await ctx.answerCbQuery()
    const link = await requireLink(ctx)
    const wizard = getWizard(ctx.chat!.id)
    if (!link || !wizard || wizard.step !== 'shift_confirm' || !link.current_object_id) {
      await ctx.reply('Сессия истекла, начните заново: /menu')
      return
    }

    const { error } = await supabase.from('shifts').insert({
      object_id: link.current_object_id,
      worker_name: wizard.workerName,
      amount: wizard.amount,
      hours: wizard.hours,
      date: wizard.date,
      paid: false,
      source: 'bot',
    })

    clearWizard(ctx.chat!.id)
    if (error) {
      await ctx.reply('Не удалось сохранить смену. Попробуйте ещё раз.')
      return
    }
    await ctx.reply(`✅ Сохранено: ${wizard.workerName}, ${formatMoney(wizard.amount)}`)
    await showMainMenu(ctx)
  })

  bot.action('shift_cancel', async (ctx) => {
    await ctx.answerCbQuery()
    clearWizard(ctx.chat!.id)
    await ctx.reply('Отменено.')
    await showMainMenu(ctx)
  })
}
