import { Markup } from 'telegraf'
import type { Telegraf } from 'telegraf'
import type { BotContext } from '../context.js'
import { getOwnedObject, getOwnedObjects, requireLink, setCurrentObject } from '../lib/auth.js'
import { clearWizard } from '../session.js'

export async function showMainMenu(ctx: BotContext): Promise<void> {
  const link = await requireLink(ctx)
  if (!link) return

  let objectLabel = 'не выбран'
  if (link.current_object_id) {
    const obj = await getOwnedObject(link.user_id, link.current_object_id)
    if (obj) objectLabel = obj.name
  }

  await ctx.reply(
    `🏗 Объект: ${objectLabel}\n\nЧто делаем?`,
    Markup.inlineKeyboard([
      [Markup.button.callback('💰 Расход', 'add_expense'), Markup.button.callback('👷 Смена', 'add_shift')],
      [Markup.button.callback('📊 Отчёт', 'open_report'), Markup.button.callback('🔁 Сменить объект', 'open_objects')],
    ]),
  )
}

export function registerMenuHandlers(bot: Telegraf<BotContext>): void {
  bot.command('menu', async (ctx) => {
    clearWizard(ctx.chat!.id)
    await showMainMenu(ctx)
  })

  bot.command('cancel', async (ctx) => {
    clearWizard(ctx.chat!.id)
    await ctx.reply('Отменено.')
    await showMainMenu(ctx)
  })

  bot.command('objects', async (ctx) => {
    await showObjectPicker(ctx)
  })

  bot.action('main_menu', async (ctx) => {
    await ctx.answerCbQuery()
    clearWizard(ctx.chat!.id)
    await showMainMenu(ctx)
  })

  bot.action('open_objects', async (ctx) => {
    await ctx.answerCbQuery()
    await showObjectPicker(ctx)
  })

  bot.action(/^set_object:(.+)$/, async (ctx) => {
    const link = await requireLink(ctx)
    if (!link) return
    const objectId = ctx.match[1]
    const obj = await getOwnedObject(link.user_id, objectId)
    if (!obj) {
      await ctx.answerCbQuery('Объект не найден')
      return
    }
    await setCurrentObject(link.id, obj.id)
    await ctx.answerCbQuery('Объект выбран')
    ctx.link = { ...link, current_object_id: obj.id }
    await ctx.editMessageText(`Текущий объект: ${obj.name}`)
    await showMainMenu(ctx)
  })
}

async function showObjectPicker(ctx: BotContext): Promise<void> {
  const link = await requireLink(ctx)
  if (!link) return

  const objects = await getOwnedObjects(link.user_id)
  if (objects.length === 0) {
    await ctx.reply('На сайте пока нет ни одного объекта. Добавьте объект в веб-приложении.')
    return
  }

  await ctx.reply(
    'Выберите объект:',
    Markup.inlineKeyboard(objects.map((o) => [Markup.button.callback(o.name, `set_object:${o.id}`)])),
  )
}
