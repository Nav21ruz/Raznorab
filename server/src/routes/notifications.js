import { Router } from 'express'
import { withUserContext } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { asyncRoute } from '../errors.js'

export const notificationsRouter = Router()
notificationsRouter.use(requireAuth)

// Один короткий запрос для значков в нижней навигации — опрашивается на всех
// экранах приложения, поэтому три счётчика в одной поездке к базе, а не три отдельных.
notificationsRouter.get('/summary', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(
      `select
         (
           select count(*) from messages m
           join conversations conv on conv.id = m.conversation_id
           left join conversation_reads cr on cr.conversation_id = conv.id and cr.profile_id = $1
           where (conv.customer_id = $1 or conv.worker_id = $1)
             and m.sender_id <> $1
             and m.created_at > coalesce(cr.last_read_at, conv.created_at)
         ) as unread_messages,
         (
           select count(*) from order_swipes s
           join orders o on o.id = s.order_id
           where o.customer_id = $1 and s.direction = 'like' and s.reviewed_by_customer = false
         ) as pending_candidates,
         (
           select count(*) from labor_responses r
           join labor_tasks t on t.id = r.task_id
           where t.customer_id = $1 and r.seen_by_customer = false
         ) as new_labor_responses
      `,
      [req.userId]
    )
  )
  const row = rows[0]
  res.json({
    unreadMessages: Number(row.unread_messages),
    pendingCandidates: Number(row.pending_candidates),
    newLaborResponses: Number(row.new_labor_responses),
  })
}))
