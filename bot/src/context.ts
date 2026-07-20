import type { Context } from 'telegraf'
import type { TelegramLink } from './types.js'

export interface BotContext extends Context {
  link: TelegramLink | null
}
