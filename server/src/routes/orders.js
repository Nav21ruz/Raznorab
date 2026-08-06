import { Router } from 'express'
import { withUserContext } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { ApiError, asyncRoute } from '../errors.js'

export const ordersRouter = Router()
ordersRouter.use(requireAuth)

const ORDER_FIELDS = ['category', 'title', 'description', 'budget_from', 'budget_to', 'city', 'address', 'photos']

// Лента для строителя: активные заказы, не свои и ещё не свайпнутые — раньше это
// выкачивалось целиком на клиент и фильтровалось в браузере, теперь считает сама база.
ordersRouter.get('/feed', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(
      `select o.* from orders o
       where o.status = 'active'
         and o.customer_id <> $1
         and not exists (select 1 from order_swipes s where s.order_id = o.id and s.builder_id = $1)
       order by o.created_at desc
       limit 100`,
      [req.userId]
    )
  )
  res.json({ orders: rows })
}))

ordersRouter.get('/mine', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query('select * from orders where customer_id = $1 order by created_at desc', [req.userId])
  )
  res.json({ orders: rows })
}))

ordersRouter.get('/:id', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query('select * from orders where id = $1', [req.params.id])
  )
  if (!rows[0]) throw new ApiError(404, 'Заказ не найден')
  res.json({ order: rows[0] })
}))

ordersRouter.post('/', asyncRoute(async (req, res) => {
  const cols = ['customer_id']
  const placeholders = ['$1']
  const values = [req.userId]
  for (const field of ORDER_FIELDS) {
    if (req.body[field] === undefined) continue
    values.push(req.body[field])
    cols.push(field)
    placeholders.push(`$${values.length}`)
  }
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(`insert into orders(${cols.join(', ')}) values (${placeholders.join(', ')}) returning *`, values)
  )
  res.status(201).json({ order: rows[0] })
}))

ordersRouter.patch('/:id/status', asyncRoute(async (req, res) => {
  const status = req.body?.status
  if (!['active', 'in_progress', 'done', 'cancelled'].includes(status)) throw new ApiError(400, 'Некорректный статус')
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query('update orders set status = $1 where id = $2 returning *', [status, req.params.id])
  )
  if (!rows[0]) throw new ApiError(404, 'Заказ не найден')
  res.json({ order: rows[0] })
}))

// --- отклики строителей на заказ (свайпы) ---

ordersRouter.post('/:id/swipe', asyncRoute(async (req, res) => {
  const direction = req.body?.direction
  if (!['like', 'pass'].includes(direction)) throw new ApiError(400, 'Некорректное направление свайпа')
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(
      `insert into order_swipes(order_id, builder_id, direction, reviewed_by_customer)
       values ($1, $2, $3, false) returning *`,
      [req.params.id, req.userId, direction]
    )
  )
  res.status(201).json({ swipe: rows[0] })
}))

ordersRouter.get('/:id/candidates', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(
      `select
         row_to_json(s) as swipe,
         row_to_json(p) as profile,
         row_to_json(bp) as builder_profile
       from order_swipes s
       join profiles p on p.id = s.builder_id
       left join builder_profiles bp on bp.id = s.builder_id
       where s.order_id = $1
         and s.direction = 'like'
         and s.reviewed_by_customer = false
         and not exists (
           select 1 from conversations c
           where c.order_id = s.order_id and c.worker_id = s.builder_id
         )
       order by s.created_at asc`,
      [req.params.id]
    )
  )
  res.json({
    candidates: rows.map((r) => ({ swipe: r.swipe, profile: r.profile, builderProfile: r.builder_profile })),
  })
}))

ordersRouter.post('/:id/confirm-match', asyncRoute(async (req, res) => {
  const builderId = req.body?.builder_id
  if (!builderId) throw new ApiError(400, 'Не указан строитель')

  const conversation = await withUserContext(req.userId, async (c) => {
    const { rows: convRows } = await c.query(
      `insert into conversations(kind, order_id, customer_id, worker_id)
       values ('order', $1, $2, $3) returning *`,
      [req.params.id, req.userId, builderId]
    )
    await c.query(
      `update order_swipes set reviewed_by_customer = true where order_id = $1 and builder_id = $2`,
      [req.params.id, builderId]
    )
    await c.query(
      `update orders set status = 'in_progress' where id = $1 and status = 'active'`,
      [req.params.id]
    )
    return convRows[0]
  })
  if (!conversation) throw new ApiError(400, 'Не удалось подтвердить отклик')
  res.status(201).json({ conversation })
}))

ordersRouter.post('/:id/reject-candidate', asyncRoute(async (req, res) => {
  const builderId = req.body?.builder_id
  if (!builderId) throw new ApiError(400, 'Не указан строитель')
  await withUserContext(req.userId, (c) =>
    c.query(
      `update order_swipes set reviewed_by_customer = true where order_id = $1 and builder_id = $2`,
      [req.params.id, builderId]
    )
  )
  res.status(204).end()
}))

export const orderSwipesRouter = Router()
orderSwipesRouter.use(requireAuth)

orderSwipesRouter.get('/mine', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(
      `select row_to_json(s) as swipe, row_to_json(o) as order
       from order_swipes s
       join orders o on o.id = s.order_id
       where s.builder_id = $1 and s.direction = 'like'
       order by s.created_at desc`,
      [req.userId]
    )
  )
  res.json({ responses: rows.map((r) => ({ swipe: r.swipe, order: r.order })) })
}))
