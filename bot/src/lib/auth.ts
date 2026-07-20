import type { MiddlewareFn } from 'telegraf'
import { supabase } from '../supabase.js'
import type { BotContext } from '../context.js'
import type { ConstructionObject, TelegramLink } from '../types.js'

export const attachLink: MiddlewareFn<BotContext> = async (ctx, next) => {
  const telegramUserId = ctx.from?.id
  ctx.link = null
  if (telegramUserId) {
    const { data } = await supabase
      .from('telegram_links')
      .select('*')
      .eq('telegram_user_id', telegramUserId)
      .maybeSingle()
    ctx.link = (data as TelegramLink | null) ?? null
  }
  return next()
}

export async function requireLink(ctx: BotContext): Promise<TelegramLink | null> {
  if (ctx.link) return ctx.link
  await ctx.reply(
    'Аккаунт ещё не привязан. Откройте на сайте раздел «Telegram» и получите код, затем отправьте сюда /link КОД.',
  )
  return null
}

export async function getOwnedObjects(userId: string): Promise<ConstructionObject[]> {
  const { data, error } = await supabase
    .from('objects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as ConstructionObject[]
}

export async function getOwnedObject(userId: string, objectId: string): Promise<ConstructionObject | null> {
  const { data, error } = await supabase
    .from('objects')
    .select('*')
    .eq('user_id', userId)
    .eq('id', objectId)
    .maybeSingle()
  if (error) throw error
  return data as ConstructionObject | null
}

export async function setCurrentObject(linkId: string, objectId: string): Promise<void> {
  const { error } = await supabase.from('telegram_links').update({ current_object_id: objectId }).eq('id', linkId)
  if (error) throw error
}
