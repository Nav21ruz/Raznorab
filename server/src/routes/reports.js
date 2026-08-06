import { Router } from 'express'
import { withUserContext } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { ApiError, asyncRoute } from '../errors.js'

export const reportsRouter = Router()
reportsRouter.use(requireAuth)

const TARGET_TYPES = ['order', 'labor_task', 'profile']

reportsRouter.post('/', asyncRoute(async (req, res) => {
  const { targetType, targetId, reason, comment } = req.body ?? {}
  if (!TARGET_TYPES.includes(targetType)) throw new ApiError(400, 'Некорректный тип жалобы')
  if (!targetId || !reason) throw new ApiError(400, 'Заполните причину жалобы')
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(
      `insert into reports(reporter_id, target_type, target_id, reason, comment, status)
       values ($1, $2, $3, $4, $5, 'pending') returning *`,
      [req.userId, targetType, targetId, reason, comment || null]
    )
  )
  if (!rows[0]) throw new ApiError(403, 'Не удалось отправить жалобу')
  res.status(201).json({ report: rows[0] })
}))
