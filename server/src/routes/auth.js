import { Router } from 'express'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { serviceQuery, serviceTx, withUserContext } from '../db.js'
import { signToken } from '../auth/jwt.js'
import { verifyTelegramInitData } from '../auth/telegram.js'
import { exchangeYandexCode } from '../auth/yandex.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { ApiError, asyncRoute } from '../errors.js'
import { env } from '../env.js'
import { sendPasswordResetEmail } from '../email.js'

export const authRouter = Router()

// Ограничения только на чувствительные точки входа (подбор пароля, спам-регистрация,
// рассылка писем сброса) — не на весь /auth, чтобы не мешать обычному использованию.
// В памяти процесса: на одном постоянном сервере (VPS, Render) работает как надо, на
// serverless (Yandex Cloud Functions) — best-effort в рамках одного тёплого контейнера,
// это всё равно лучше, чем совсем без защиты.
const authLimitMessage = { error: 'Слишком много попыток. Попробуйте снова через несколько минут.' }
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: authLimitMessage })
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false, message: authLimitMessage })
const forgotPasswordLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 4, standardHeaders: true, legacyHeaders: false, message: authLimitMessage })
const resetPasswordLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: authLimitMessage })

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(email) {
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    throw new ApiError(400, 'Введите корректный email')
  }
  return email.trim().toLowerCase()
}

function checkPassword(password) {
  if (typeof password !== 'string' || password.length < 6) {
    throw new ApiError(400, 'Пароль должен быть не короче 6 символов')
  }
}

async function fetchProfile(profileId) {
  const { rows } = await withUserContext(profileId, (c) =>
    c.query('select * from profiles where id = $1', [profileId])
  )
  return rows[0] ?? null
}

authRouter.post('/register', registerLimiter, asyncRoute(async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  checkPassword(req.body.password)

  const { rows: existing } = await serviceQuery('select 1 from auth_credentials where email = $1', [email])
  if (existing.length) throw new ApiError(409, 'Такой email уже зарегистрирован')

  const profileId = crypto.randomUUID()
  const passwordHash = await bcrypt.hash(req.body.password, 10)

  const profile = await serviceTx(async (c) => {
    await c.query('insert into auth.users(id) values ($1)', [profileId])
    const { rows } = await c.query(
      'insert into profiles(id, first_name) values ($1, $2) returning *',
      [profileId, 'Пользователь']
    )
    await c.query(
      'insert into auth_credentials(profile_id, email, password_hash) values ($1, $2, $3)',
      [profileId, email, passwordHash]
    )
    return rows[0]
  })

  res.status(201).json({ token: signToken(profileId), profile })
}))

authRouter.post('/login', loginLimiter, asyncRoute(async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  if (typeof req.body?.password !== 'string') throw new ApiError(400, 'Введите пароль')

  const { rows } = await serviceQuery(
    'select profile_id, password_hash from auth_credentials where email = $1',
    [email]
  )
  const cred = rows[0]
  const ok = cred ? await bcrypt.compare(req.body.password, cred.password_hash) : false
  if (!ok) throw new ApiError(401, 'Неверный email или пароль')

  const profile = await fetchProfile(cred.profile_id)
  res.json({ token: signToken(cred.profile_id), profile })
}))

authRouter.post('/telegram', asyncRoute(async (req, res) => {
  const initData = req.body?.initData
  if (typeof initData !== 'string' || !initData) throw new ApiError(400, 'Нет данных Telegram')
  const tgUser = verifyTelegramInitData(initData)

  const { rows: found } = await serviceQuery('select * from profiles where telegram_id = $1', [tgUser.id])
  let profile = found[0]

  if (!profile) {
    const profileId = crypto.randomUUID()
    profile = await serviceTx(async (c) => {
      await c.query('insert into auth.users(id) values ($1)', [profileId])
      const { rows } = await c.query(
        `insert into profiles(id, telegram_id, telegram_username, first_name, last_name, photo_url)
         values ($1, $2, $3, $4, $5, $6) returning *`,
        [
          profileId,
          tgUser.id,
          tgUser.username ?? null,
          tgUser.first_name ?? 'Пользователь',
          tgUser.last_name ?? null,
          tgUser.photo_url ?? null,
        ]
      )
      return rows[0]
    })
  }

  res.json({ token: signToken(profile.id), profile })
}))

authRouter.post('/yandex', asyncRoute(async (req, res) => {
  const code = req.body?.code
  if (typeof code !== 'string' || !code) throw new ApiError(400, 'Нет кода авторизации Яндекса')
  const yaUser = await exchangeYandexCode(code)

  const { rows: found } = await serviceQuery('select * from profiles where yandex_id = $1', [yaUser.id])
  let profile = found[0]

  if (!profile) {
    const profileId = crypto.randomUUID()
    profile = await serviceTx(async (c) => {
      await c.query('insert into auth.users(id) values ($1)', [profileId])
      const { rows } = await c.query(
        `insert into profiles(id, yandex_id, first_name, last_name, photo_url)
         values ($1, $2, $3, $4, $5) returning *`,
        [profileId, yaUser.id, yaUser.firstName, yaUser.lastName, yaUser.photoUrl]
      )
      return rows[0]
    })
  }

  res.json({ token: signToken(profile.id), profile })
}))

authRouter.post('/forgot-password', forgotPasswordLimiter, asyncRoute(async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 час

  // Ниже ВСЕГДА выполняются ровно два запроса, независимо от того, существует
  // ли email — если делать это только "внутри if", по времени ответа можно
  // было бы статистически отличить существующий email от несуществующего
  // (лишний DELETE+INSERT занимают на пару миллисекунд больше, чем ничего).
  // select вместо email напрямую — вложенным запросом, чтобы "несуществующий
  // email" тоже дошёл до DELETE/INSERT с тем же планом выполнения.
  await serviceQuery(
    'delete from password_resets where profile_id = (select profile_id from auth_credentials where email = $1)',
    [email]
  )
  // старые токены той же учётки становятся недействительны — иначе несколько
  // ссылок из разных запросов "забыл пароль" продолжали бы работать одновременно
  const { rows } = await serviceQuery(
    `insert into password_resets(token, profile_id, expires_at)
     select $1, profile_id, $2 from auth_credentials where email = $3
     returning profile_id`,
    [token, expiresAt, email]
  )
  if (rows[0]) {
    const resetUrl = `${env.siteUrl}/auth/reset-password?token=${token}`
    // не ждём отправку письма — иначе по времени ответа можно было бы отличить
    // "такой email есть" (дольше, идёт SMTP) от "такого email нет" (мгновенно)
    sendPasswordResetEmail(email, resetUrl).catch((e) => console.error('[email] не удалось отправить письмо сброса пароля:', e))
  }

  // Ответ ОДИНАКОВЫЙ независимо от того, существует ли email — иначе перебором
  // можно было бы узнавать, кто зарегистрирован на сайте.
  res.json({ ok: true })
}))

authRouter.post('/reset-password', resetPasswordLimiter, asyncRoute(async (req, res) => {
  const token = req.body?.token
  if (typeof token !== 'string' || !token) throw new ApiError(400, 'Нет кода сброса пароля')
  checkPassword(req.body?.password)

  const { rows } = await serviceQuery(
    'select profile_id from password_resets where token = $1 and expires_at > now()',
    [token]
  )
  if (!rows[0]) throw new ApiError(400, 'Ссылка для сброса пароля недействительна или устарела')

  const passwordHash = await bcrypt.hash(req.body.password, 10)
  await serviceQuery('update auth_credentials set password_hash = $1 where profile_id = $2', [passwordHash, rows[0].profile_id])
  await serviceQuery('delete from password_resets where profile_id = $1', [rows[0].profile_id])

  res.json({ ok: true })
}))

authRouter.get('/me', requireAuth, asyncRoute(async (req, res) => {
  const profile = await fetchProfile(req.userId)
  if (!profile) throw new ApiError(404, 'Профиль не найден')
  res.json({ profile })
}))
