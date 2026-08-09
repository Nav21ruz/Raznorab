import { env } from '../env.js'
import { ApiError } from '../errors.js'

/**
 * Обмен кода на токен и данные пользователя — только на сервере: клиентский
 * секрет (YANDEX_CLIENT_SECRET) не должен попадать в браузер ни при каких
 * условиях, поэтому весь обмен идёт здесь, а не во фронтенде.
 */
export async function exchangeYandexCode(code) {
  if (!env.yandex.clientId || !env.yandex.clientSecret) {
    throw new ApiError(500, 'Вход через Яндекс не настроен на сервере (нет YANDEX_CLIENT_ID/YANDEX_CLIENT_SECRET)')
  }

  const tokenRes = await fetch('https://oauth.yandex.ru/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: env.yandex.clientId,
      client_secret: env.yandex.clientSecret,
    }),
  })
  if (!tokenRes.ok) {
    throw new ApiError(401, 'Не удалось подтвердить вход через Яндекс (код устарел или уже использован)')
  }
  const { access_token: accessToken } = await tokenRes.json()

  const infoRes = await fetch('https://login.yandex.ru/info?format=json', {
    headers: { authorization: `OAuth ${accessToken}` },
  })
  if (!infoRes.ok) throw new ApiError(401, 'Не удалось получить данные аккаунта Яндекс')
  const info = await infoRes.json()

  return {
    id: String(info.id),
    firstName: info.first_name || info.real_name || info.login || 'Пользователь',
    lastName: info.last_name || null,
    email: info.default_email || null,
    photoUrl: info.is_avatar_empty ? null : `https://avatars.yandex.net/get-yapic/${info.default_avatar_id}/islands-200`,
  }
}
