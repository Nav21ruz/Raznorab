import type { Telegraf } from 'telegraf'
import { supabase } from '../supabase.js'
import type { BotContext } from '../context.js'
import type { TelegramLink } from '../types.js'
import { showMainMenu } from './menu.js'

async function tryLink(ctx: BotContext, rawCode: string | undefined): Promise<boolean> {
  const code = rawCode?.trim().toUpperCase()
  if (!code) return false

  const { data: codeRow, error } = await supabase
    .from('telegram_link_codes')
    .select('*')
    .eq('code', code)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error || !codeRow) {
    await ctx.reply('Код не найден или уже истёк. Получите новый код на сайте в разделе «Telegram».')
    return true
  }

  const telegramUserId = ctx.from!.id
  const telegramChatId = ctx.chat!.id

  const { data: link, error: linkError } = await supabase
    .from('telegram_links')
    .upsert(
      { telegram_user_id: telegramUserId, telegram_chat_id: telegramChatId, user_id: codeRow.user_id },
      { onConflict: 'telegram_user_id' },
    )
    .select()
    .single()

  if (linkError || !link) {
    await ctx.reply('Не удалось привязать аккаунт. Попробуйте ещё раз чуть позже.')
    return true
  }

  await supabase.from('telegram_link_codes').update({ used_at: new Date().toISOString() }).eq('id', codeRow.id)

  ctx.link = link as TelegramLink
  await ctx.reply('✅ Аккаунт привязан! Теперь можно вести учёт расходов и смен прямо здесь.')
  await showMainMenu(ctx)
  return true
}

export function registerLinkHandlers(bot: Telegraf<BotContext>): void {
  bot.start(async (ctx) => {
    if (ctx.link) {
      await ctx.reply('С возвращением!')
      await showMainMenu(ctx)
      return
    }

    const payload = ctx.startPayload?.trim()
    if (payload && (await tryLink(ctx, payload))) return

    await ctx.reply(
      'Привет! Я помогу вести учёт расходов на объекте и выплат рабочим.\n\n' +
        'Чтобы начать, привяжите аккаунт: откройте сайт → раздел «Telegram» → получите код, ' +
        'затем отправьте команду /link КОД.',
    )
  })

  bot.command('link', async (ctx) => {
    const arg = ctx.message.text.split(' ').slice(1).join(' ')
    if (!(await tryLink(ctx, arg))) {
      await ctx.reply('Использование: /link КОД')
    }
  })
}
