import { Router } from 'express'
import { withUserContext } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { ApiError, asyncRoute } from '../errors.js'

export const adminRouter = Router()
adminRouter.use(requireAuth)

// Кто именно админ и что ему видно — решает RLS (см. supabase/moderation_schema.sql),
// не эти маршруты: обычный пользователь получит просто 0 строк на все запросы ниже.
adminRouter.get('/check', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query('select 1 from admins where profile_id = $1', [req.userId])
  )
  res.json({ isAdmin: rows.length > 0 })
}))

// count(*) вместо выкачивания всей таблицы на клиент ради длины массива.
adminRouter.get('/counts', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(`
      select
        (select count(*) from profiles) as profiles,
        (select count(*) from orders) as orders,
        (select count(*) from labor_tasks) as labor_tasks,
        (select count(*) from reports where status = 'pending') as pending_reports,
        (select count(*) from banned_users) as banned_users
    `)
  )
  const r = rows[0]
  res.json({
    profiles: Number(r.profiles),
    orders: Number(r.orders),
    laborTasks: Number(r.labor_tasks),
    pendingReports: Number(r.pending_reports),
    bannedUsers: Number(r.banned_users),
  })
}))

adminRouter.get('/reports', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query('select * from reports order by created_at desc')
  )
  res.json({ reports: rows })
}))

adminRouter.patch('/reports/:id', asyncRoute(async (req, res) => {
  const status = req.body?.status
  if (!['pending', 'reviewed', 'dismissed', 'actioned'].includes(status)) throw new ApiError(400, 'Некорректный статус')
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query('update reports set status = $1 where id = $2 returning *', [status, req.params.id])
  )
  if (!rows[0]) throw new ApiError(404, 'Жалоба не найдена')
  res.json({ report: rows[0] })
}))

// Поиск по подстроке на стороне базы (ускоряется триграммными индексами из
// performance_schema.sql) вместо выкачивания всей таблицы пользователей на клиент.
adminRouter.get('/users', asyncRoute(async (req, res) => {
  const q = String(req.query.search ?? '').trim()
  const { rows } = await withUserContext(req.userId, (c) =>
    q
      ? c.query(
          `select * from profiles
           where first_name ilike $1 or last_name ilike $1 or telegram_username ilike $1
             or phone ilike $1 or city ilike $1
           order by created_at desc limit 50`,
          [`%${q}%`]
        )
      : c.query('select * from profiles order by created_at desc limit 50')
  )
  res.json({ profiles: rows })
}))

adminRouter.get('/banned-users', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query('select * from banned_users order by banned_at desc')
  )
  res.json({ bannedUsers: rows })
}))

adminRouter.post('/users/:id/ban', asyncRoute(async (req, res) => {
  const reason = req.body?.reason
  if (!reason) throw new ApiError(400, 'Укажите причину бана')
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(
      `insert into banned_users(profile_id, reason, banned_by) values ($1, $2, $3) returning *`,
      [req.params.id, reason, req.userId]
    )
  )
  if (!rows[0]) throw new ApiError(403, 'Недостаточно прав')
  res.status(201).json({ bannedUser: rows[0] })
}))

adminRouter.delete('/users/:id/ban', asyncRoute(async (req, res) => {
  await withUserContext(req.userId, (c) =>
    c.query('delete from banned_users where profile_id = $1', [req.params.id])
  )
  res.status(204).end()
}))

adminRouter.get('/words', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query('select * from banned_words order by created_at asc')
  )
  res.json({ words: rows })
}))

adminRouter.post('/words', asyncRoute(async (req, res) => {
  const pattern = req.body?.pattern
  if (!pattern) throw new ApiError(400, 'Укажите слово или шаблон')
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query('insert into banned_words(pattern) values ($1) returning *', [pattern])
  )
  if (!rows[0]) throw new ApiError(403, 'Недостаточно прав')
  res.status(201).json({ word: rows[0] })
}))

adminRouter.delete('/words/:id', asyncRoute(async (req, res) => {
  await withUserContext(req.userId, (c) => c.query('delete from banned_words where id = $1', [req.params.id]))
  res.status(204).end()
}))

// Публичный (для любого вошедшего) список слов — нужен на клиенте для мгновенной
// проверки при вводе текста, до отправки на сервер.
export const bannedWordsPublicRouter = Router()
bannedWordsPublicRouter.use(requireAuth)
bannedWordsPublicRouter.get('/', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) => c.query('select * from banned_words order by created_at asc'))
  res.json({ words: rows })
}))

export const moderationRouter = Router()
moderationRouter.use(requireAuth)

moderationRouter.get('/my-ban-status', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query('select * from banned_users where profile_id = $1', [req.userId])
  )
  res.json({ ban: rows[0] ?? null })
}))
