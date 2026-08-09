import { Router } from 'express'
import { withUserContext } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { ApiError, asyncRoute } from '../errors.js'

export const profilesRouter = Router()
profilesRouter.use(requireAuth)

const PROFILE_FIELDS = ['role', 'first_name', 'last_name', 'phone', 'city']
const BUILDER_FIELDS = ['specialties', 'experience_years', 'price_from', 'price_to', 'about', 'portfolio_photos', 'is_active']

function parseIds(raw) {
  return String(raw ?? '').split(',').map((s) => s.trim()).filter(Boolean)
}

// profiles читаются публично (нужно для лент/свайпов), но телефон — не общедоступные
// данные: его видно только самому владельцу и тем, с кем уже есть подтверждённый
// мэтч (общий чат в conversations). Иначе любой авторизованный пользователь мог бы
// пройтись по всем orders/labor_tasks и собрать телефоны всех заказчиков и исполнителей.
const PUBLIC_PROFILE_COLUMNS = `
  id, telegram_id, telegram_username, first_name, last_name, photo_url, city, role, created_at,
  case
    when profiles.id = $1 or exists (
      select 1 from conversations c
      where (c.customer_id = $1 and c.worker_id = profiles.id)
         or (c.worker_id = $1 and c.customer_id = profiles.id)
    )
    then phone
    else null
  end as phone
`

profilesRouter.get('/', asyncRoute(async (req, res) => {
  const ids = parseIds(req.query.ids)
  if (!ids.length) return res.json({ profiles: [] })
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(`select ${PUBLIC_PROFILE_COLUMNS} from profiles where id = any($2::uuid[])`, [req.userId, ids])
  )
  res.json({ profiles: rows })
}))

profilesRouter.get('/:id', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(`select ${PUBLIC_PROFILE_COLUMNS} from profiles where id = $2`, [req.userId, req.params.id])
  )
  if (!rows[0]) throw new ApiError(404, 'Профиль не найден')
  res.json({ profile: rows[0] })
}))

profilesRouter.get('/:id/reviews', asyncRoute(async (req, res) => {
  const { rows, summaryRows } = await withUserContext(req.userId, async (c) => {
    const { rows } = await c.query(
      `select row_to_json(r) as review, row_to_json(p) as reviewer
       from reviews r
       join profiles p on p.id = r.reviewer_id
       where r.reviewee_id = $1
       order by r.created_at desc`,
      [req.params.id]
    )
    const { rows: summaryRows } = await c.query(
      `select avg(rating)::numeric(10,2) as average, count(*) as count from reviews where reviewee_id = $1`,
      [req.params.id]
    )
    return { rows, summaryRows }
  })
  res.json({
    reviews: rows.map((r) => ({ ...r.review, reviewerName: `${r.reviewer.first_name} ${r.reviewer.last_name ?? ''}`.trim() || 'Пользователь', reviewerPhoto: r.reviewer.photo_url })),
    average: summaryRows[0].average ? Number(summaryRows[0].average) : null,
    count: Number(summaryRows[0].count),
  })
}))

profilesRouter.patch('/me', asyncRoute(async (req, res) => {
  const sets = []
  const values = []
  for (const field of PROFILE_FIELDS) {
    if (req.body[field] === undefined) continue
    values.push(req.body[field])
    sets.push(`${field} = $${values.length}`)
  }
  if (!sets.length) throw new ApiError(400, 'Нечего сохранять')
  values.push(req.userId)
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(`update profiles set ${sets.join(', ')} where id = $${values.length} returning *`, values)
  )
  if (!rows[0]) throw new ApiError(404, 'Профиль не найден')
  res.json({ profile: rows[0] })
}))

export const builderProfilesRouter = Router()
builderProfilesRouter.use(requireAuth)

builderProfilesRouter.get('/', asyncRoute(async (req, res) => {
  const ids = parseIds(req.query.ids)
  if (!ids.length) return res.json({ builderProfiles: [] })
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query('select * from builder_profiles where id = any($1::uuid[])', [ids])
  )
  res.json({ builderProfiles: rows })
}))

builderProfilesRouter.get('/:id', asyncRoute(async (req, res) => {
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query('select * from builder_profiles where id = $1', [req.params.id])
  )
  res.json({ builderProfile: rows[0] ?? null })
}))

builderProfilesRouter.put('/me', asyncRoute(async (req, res) => {
  const cols = ['id']
  const placeholders = ['$1']
  const values = [req.userId]
  const updateSets = []
  for (const field of BUILDER_FIELDS) {
    if (req.body[field] === undefined) continue
    values.push(req.body[field])
    cols.push(field)
    placeholders.push(`$${values.length}`)
    updateSets.push(`${field} = excluded.${field}`)
  }
  const { rows } = await withUserContext(req.userId, (c) =>
    c.query(
      `insert into builder_profiles(${cols.join(', ')}) values (${placeholders.join(', ')})
       on conflict (id) do update set ${updateSets.join(', ')}
       returning *`,
      values
    )
  )
  res.json({ builderProfile: rows[0] })
}))
