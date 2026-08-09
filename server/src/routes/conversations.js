import { Router } from 'express'
import { withUserContext } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { ApiError, asyncRoute } from '../errors.js'

export const conversationsRouter = Router()
conversationsRouter.use(requireAuth)

// Один запрос вместо пяти отдельных (участники, собеседники, заказы/задачи, последние
// сообщения) — использует conversation_last_messages из performance_schema.sql.
conversationsRouter.get('/', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(
      `select
         row_to_json(conv) as conversation,
         row_to_json(peer) as peer,
         o.title as order_title,
         t.title as labor_title,
         lm.text as last_message_text,
         lm.created_at as last_message_at,
         (
           select count(*) from messages m
           where m.conversation_id = conv.id
             and m.sender_id <> $1
             and m.created_at > coalesce(cr.last_read_at, conv.created_at)
         ) as unread_count
       from conversations conv
       join profiles peer on peer.id = (case when conv.customer_id = $1 then conv.worker_id else conv.customer_id end)
       left join orders o on o.id = conv.order_id
       left join labor_tasks t on t.id = conv.labor_task_id
       left join conversation_last_messages lm on lm.conversation_id = conv.id
       left join conversation_reads cr on cr.conversation_id = conv.id and cr.profile_id = $1
       where conv.customer_id = $1 or conv.worker_id = $1
       order by coalesce(lm.created_at, conv.created_at) desc`,
      [req.userId]
    )
  )
  res.json({
    conversations: rows.map((r) => ({
      ...r.conversation,
      peerName: `${r.peer.first_name} ${r.peer.last_name ?? ''}`.trim() || 'Пользователь',
      peerPhoto: r.peer.photo_url,
      contextTitle: r.conversation.kind === 'order' ? (r.order_title ?? '—') : (r.labor_title ?? '—'),
      lastMessage: r.last_message_text ?? undefined,
      lastMessageAt: r.last_message_at ?? undefined,
      unreadCount: Number(r.unread_count),
    })),
  })
}))

conversationsRouter.get('/:id', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query('select * from conversations where id = $1', [req.params.id])
  )
  if (!rows[0]) throw new ApiError(404, 'Чат не найден')
  res.json({ conversation: rows[0] })
}))

// Обновление опросом (не realtime): клиент периодически перезапрашивает список
// сообщений — см. решение вынести чат на обычные REST-запросы вместо WebSocket.
conversationsRouter.get('/:id/messages', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(
      'select * from messages where conversation_id = $1 order by created_at asc',
      [req.params.id]
    )
  )
  res.json({ messages: rows })
}))

// Отмечает переписку прочитанной до текущего момента — вызывается при открытии
// чата и периодически, пока он открыт (чтобы сообщения, пришедшие во время
// просмотра, тоже не считались непрочитанными).
conversationsRouter.post('/:id/read', asyncRoute(async (req, res) => {
  await withUserContext(req.userId, (c) =>
    c.query(
      `insert into conversation_reads(conversation_id, profile_id, last_read_at)
       values ($1, $2, now())
       on conflict (conversation_id, profile_id) do update set last_read_at = now()`,
      [req.params.id, req.userId]
    )
  )
  res.status(204).end()
}))

conversationsRouter.post('/:id/messages', asyncRoute(async (req, res) => {
  const text = req.body?.text
  if (typeof text !== 'string' || !text.trim()) throw new ApiError(400, 'Пустое сообщение')
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(
      `insert into messages(conversation_id, sender_id, text) values ($1, $2, $3) returning *`,
      [req.params.id, req.userId, text]
    )
  )
  if (!rows[0]) throw new ApiError(403, 'Нет доступа к этому чату')
  res.status(201).json({ message: rows[0] })
}))

// Отзыв о собеседнике этой переписки — reviewee вычисляется на сервере (второй
// участник), а не берётся из тела запроса, чтобы нельзя было подделать, кого хвалим/ругаем.
conversationsRouter.post('/:id/review', asyncRoute(async (req, res) => {
  const rating = Number(req.body?.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ApiError(400, 'Оценка должна быть от 1 до 5')
  const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() || null : null

  const review = await withUserContext(req.userId, async (c) => {
    const { rows: convRows } = await c.query('select * from conversations where id = $1', [req.params.id])
    const conv = convRows[0]
    if (!conv) return null
    const revieweeId = conv.customer_id === req.userId ? conv.worker_id : conv.customer_id
    const { rows } = await c.query(
      `insert into reviews(conversation_id, reviewer_id, reviewee_id, rating, comment)
       values ($1, $2, $3, $4, $5) returning *`,
      [req.params.id, req.userId, revieweeId, rating, comment]
    )
    return rows[0]
  })
  if (!review) throw new ApiError(404, 'Чат не найден')
  res.status(201).json({ review })
}))

conversationsRouter.get('/:id/my-review', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query('select * from reviews where conversation_id = $1 and reviewer_id = $2', [req.params.id, req.userId])
  )
  res.json({ review: rows[0] ?? null })
}))
