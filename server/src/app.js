import express from 'express'
import cors from 'cors'
import { env } from './env.js'
import { authRouter } from './routes/auth.js'
import { profilesRouter, builderProfilesRouter } from './routes/profiles.js'
import { ordersRouter, orderSwipesRouter } from './routes/orders.js'
import { laborTasksRouter, laborResponsesRouter } from './routes/labor.js'
import { conversationsRouter } from './routes/conversations.js'
import { notificationsRouter } from './routes/notifications.js'
import { reportsRouter } from './routes/reports.js'
import { adminRouter, bannedWordsPublicRouter, moderationRouter } from './routes/admin.js'
import { uploadsRouter } from './routes/uploads.js'
import { ApiError } from './errors.js'

export const app = express()
// За приложением всегда стоит один обратный прокси (шлюз Яндекс.Облака, Render
// и т.п.) — без этого req.ip был бы адресом самого прокси у ВСЕХ запросов сразу,
// и ограничение частоты запросов (см. routes/auth.js) считало бы всех одним человеком.
app.set('trust proxy', 1)
app.use(cors({ origin: env.corsOrigin }))
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => res.json({ ok: true }))

app.use('/auth', authRouter)
app.use('/profiles', profilesRouter)
app.use('/builder-profiles', builderProfilesRouter)
app.use('/orders', ordersRouter)
app.use('/order-swipes', orderSwipesRouter)
app.use('/labor-tasks', laborTasksRouter)
app.use('/labor-responses', laborResponsesRouter)
app.use('/conversations', conversationsRouter)
app.use('/notifications', notificationsRouter)
app.use('/reports', reportsRouter)
app.use('/admin', adminRouter)
app.use('/banned-words', bannedWordsPublicRouter)
app.use('/moderation', moderationRouter)
app.use('/uploads', uploadsRouter)

app.use((_req, res) => res.status(404).json({ error: 'Не найдено' }))

app.use((err, _req, res, _next) => {
  if (err instanceof ApiError) return res.status(err.status).json({ error: err.message })
  // 42501 — нарушение политики RLS (например, WITH CHECK на insert): значит у
  // пользователя просто нет прав на это действие, а не поломка сервера.
  if (err?.code === '42501') return res.status(403).json({ error: 'Недостаточно прав для этого действия' })
  // unique_violation — например, повторный отклик на один и тот же заказ
  if (err?.code === '23505') return res.status(409).json({ error: 'Такая запись уже существует' })
  console.error(err)
  res.status(500).json({ error: 'Внутренняя ошибка сервера' })
})
