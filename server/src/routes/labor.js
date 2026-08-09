import { Router } from 'express'
import { withUserContext } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { ApiError, asyncRoute } from '../errors.js'

export const laborTasksRouter = Router()
laborTasksRouter.use(requireAuth)

const TASK_FIELDS = ['title', 'description', 'city', 'pay_amount', 'pay_type', 'date_needed']
const PAY_TYPES = ['per_task', 'per_day', 'per_hour']

// Необязательные фильтры из строки запроса — см. такой же приём в orders.js/feed.
laborTasksRouter.get('/feed', asyncRoute(async (req, res) => {
  const conditions = [`status = 'active'`]
  const params = []

  const { city, search, payType } = req.query
  const payMin = Number(req.query.payMin)

  if (typeof city === 'string' && city.trim()) {
    params.push(`%${city.trim()}%`)
    conditions.push(`city ilike $${params.length}`)
  }
  if (typeof search === 'string' && search.trim()) {
    params.push(`%${search.trim()}%`)
    conditions.push(`(title ilike $${params.length} or description ilike $${params.length})`)
  }
  if (typeof payType === 'string' && PAY_TYPES.includes(payType)) {
    params.push(payType)
    conditions.push(`pay_type = $${params.length}`)
  }
  if (Number.isFinite(payMin)) {
    params.push(payMin)
    conditions.push(`(pay_amount is null or pay_amount >= $${params.length})`)
  }

  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(`select * from labor_tasks where ${conditions.join(' and ')} order by created_at desc limit 100`, params)
  )
  res.json({ tasks: rows })
}))

laborTasksRouter.get('/mine', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query('select * from labor_tasks where customer_id = $1 order by created_at desc', [req.userId])
  )
  res.json({ tasks: rows })
}))

laborTasksRouter.get('/:id', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query('select * from labor_tasks where id = $1', [req.params.id])
  )
  if (!rows[0]) throw new ApiError(404, 'Задача не найдена')
  res.json({ task: rows[0] })
}))

laborTasksRouter.post('/', asyncRoute(async (req, res) => {
  const cols = ['customer_id']
  const placeholders = ['$1']
  const values = [req.userId]
  for (const field of TASK_FIELDS) {
    if (req.body[field] === undefined) continue
    values.push(req.body[field])
    cols.push(field)
    placeholders.push(`$${values.length}`)
  }
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(`insert into labor_tasks(${cols.join(', ')}) values (${placeholders.join(', ')}) returning *`, values)
  )
  res.status(201).json({ task: rows[0] })
}))

laborTasksRouter.patch('/:id/close', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(`update labor_tasks set status = 'closed' where id = $1 returning *`, [req.params.id])
  )
  if (!rows[0]) throw new ApiError(404, 'Задача не найдена')
  res.json({ task: rows[0] })
}))

laborTasksRouter.get('/:id/responses', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(
      `select row_to_json(r) as response, row_to_json(p) as profile
       from labor_responses r
       join profiles p on p.id = r.laborer_id
       where r.task_id = $1
       order by r.created_at asc`,
      [req.params.id]
    )
  )
  res.json({ responses: rows.map((row) => ({ response: row.response, profile: row.profile })) })
}))

// Отмечает отклики просмотренными — вызывается, когда заказчик открывает список
// откликов на свою задачу. RLS-политика ограничивает это своим же заказчиком:
// вызов от кого угодно ещё просто не изменит ни одной строки.
laborTasksRouter.patch('/:id/responses/seen', asyncRoute(async (req, res) => {
  await withUserContext(req.userId, (c) =>
    c.query(`update labor_responses set seen_by_customer = true where task_id = $1`, [req.params.id])
  )
  res.status(204).end()
}))

laborTasksRouter.post('/:id/accept', asyncRoute(async (req, res) => {
  const laborerId = req.body?.laborer_id
  if (!laborerId) throw new ApiError(400, 'Не указан разнорабочий')
  const conversation = await withUserContext(req.userId, async (c) => {
    const { rows } = await c.query(
      `insert into conversations(kind, labor_task_id, customer_id, worker_id)
       values ('labor', $1, $2, $3) returning *`,
      [req.params.id, req.userId, laborerId]
    )
    await c.query(`update labor_tasks set status = 'closed' where id = $1`, [req.params.id])
    return rows[0]
  })
  if (!conversation) throw new ApiError(400, 'Не удалось принять отклик')
  res.status(201).json({ conversation })
}))

export const laborResponsesRouter = Router()
laborResponsesRouter.use(requireAuth)

laborResponsesRouter.get('/mine', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(
      `select row_to_json(r) as response, row_to_json(t) as task
       from labor_responses r
       join labor_tasks t on t.id = r.task_id
       where r.laborer_id = $1
       order by r.created_at desc`,
      [req.userId]
    )
  )
  res.json({ responses: rows.map((row) => ({ response: row.response, task: row.task })) })
}))

laborResponsesRouter.get('/for-task/:taskId', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(
      'select * from labor_responses where task_id = $1 and laborer_id = $2',
      [req.params.taskId, req.userId]
    )
  )
  res.json({ response: rows[0] ?? null })
}))

laborResponsesRouter.post('/', asyncRoute(async (req, res) => {
  const { task_id: taskId, message } = req.body ?? {}
  if (!taskId) throw new ApiError(400, 'Не указана задача')
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(
      `insert into labor_responses(task_id, laborer_id, message) values ($1, $2, $3) returning *`,
      [taskId, req.userId, message ?? null]
    )
  )
  res.status(201).json({ response: rows[0] })
}))
