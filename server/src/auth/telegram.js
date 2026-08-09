import crypto from 'node:crypto'
import { env } from '../env.js'
import { ApiError } from '../errors.js'

/**
 * Проверка подписи Telegram WebApp initData (см. https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).
 * Без этого кто угодно мог бы прислать чужой telegram_id и войти под чужим аккаунтом —
 * подпись доказывает, что данные действительно выданы Telegram именно для нашего бота.
 */
export function verifyTelegramInitData(initData) {
  if (!env.telegramBotToken) {
    throw new ApiError(500, 'Вход через Telegram не настроен на сервере (нет TELEGRAM_BOT_TOKEN)')
  }
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) throw new ApiError(400, 'Некорректные данные Telegram')
  params.delete('hash')

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(env.telegramBotToken).digest()
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  if (computedHash !== hash) throw new ApiError(401, 'Подпись Telegram не совпадает')

  const authDate = Number(params.get('auth_date') ?? 0)
  if (!authDate || Date.now() / 1000 - authDate > 86400) {
    throw new ApiError(401, 'Данные Telegram устарели, откройте мини-приложение заново')
  }

  const userJson = params.get('user')
  if (!userJson) throw new ApiError(400, 'В данных Telegram нет пользователя')
  return JSON.parse(userJson)
}
