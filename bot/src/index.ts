import { Telegraf } from 'telegraf'
import { env } from './env.js'
import type { BotContext } from './context.js'
import { attachLink, requireLink } from './lib/auth.js'
import { getWizard } from './session.js'
import { registerLinkHandlers } from './handlers/link.js'
import { registerMenuHandlers } from './handlers/menu.js'
import { registerExpenseHandlers, handleExpenseDetailsText, renderExpenseConfirm } from './handlers/expense.js'
import { registerShiftHandlers, handleShiftWorkerText, handleShiftDetailsText, renderShiftConfirm } from './handlers/shift.js'
import { registerReportHandlers } from './handlers/report.js'
import { parseFinanceMessage } from './ai.js'

const bot = new Telegraf<BotContext>(env.TELEGRAM_BOT_TOKEN)

bot.use(attachLink)

registerLinkHandlers(bot)
registerMenuHandlers(bot)
registerExpenseHandlers(bot)
registerShiftHandlers(bot)
registerReportHandlers(bot)

bot.on('text', async (ctx) => {
  const text = ctx.message.text
  if (text.startsWith('/')) return

  const chatId = ctx.chat.id
  const wizard = getWizard(chatId)

  if (wizard) {
    switch (wizard.step) {
      case 'expense_details':
        await handleExpenseDetailsText(ctx, wizard.category, text)
        return
      case 'shift_worker':
        await handleShiftWorkerText(ctx, text)
        return
      case 'shift_details':
        await handleShiftDetailsText(ctx, wizard.workerName, text)
        return
      default:
        await ctx.reply('Пожалуйста, воспользуйтесь кнопками выше или отправьте /cancel')
        return
    }
  }

  const link = await requireLink(ctx)
  if (!link) return

  if (!link.current_object_id) {
    await ctx.reply('Сначала выберите объект: /objects')
    return
  }

  if (!env.ANTHROPIC_API_KEY) {
    await ctx.reply('Не понял сообщение. Используйте /menu, чтобы добавить расход или смену через кнопки.')
    return
  }

  const parsed = await parseFinanceMessage(text)

  if (!parsed || parsed.type === 'unclear') {
    await ctx.reply(
      'Не смог распознать сумму и тип операции. Опишите точнее, например «купил цемент 5 мешков за 4500» ' +
        'или «заплатил Ивану 2500 за смену», либо воспользуйтесь /menu.',
    )
    return
  }

  if (parsed.type === 'expense') {
    await renderExpenseConfirm(ctx, {
      amount: parsed.amount,
      category: parsed.category,
      description: parsed.description,
      date: parsed.date,
    })
    return
  }

  await renderShiftConfirm(ctx, {
    workerName: parsed.workerName,
    amount: parsed.amount,
    hours: parsed.hours,
    date: parsed.date,
  })
})

bot.catch((err, ctx) => {
  console.error(`Ошибка при обработке update ${ctx.updateType}:`, err)
})

bot.launch(() => {
  console.log('Raznorab bot запущен')
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
