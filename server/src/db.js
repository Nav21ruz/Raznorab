import pg from 'pg'
import { env } from './env.js'

const { Pool, types } = pg

// pg по умолчанию отдаёт bigint (profiles.telegram_id) строкой — из соображений
// точности для очень больших чисел. Telegram-id всегда укладывается в безопасный
// диапазон JS Number, а фронтенд (типы, унаследованные от Supabase/PostgREST)
// ожидает именно number — приводим как в оригинале.
types.setTypeParser(20, (value) => (value === null ? null : parseInt(value, 10)))

// Сервисная роль (bypass RLS) — только для регистрации/логина и системных операций,
// НИКОГДА не используется для запросов от имени конкретного пользователя.
const servicePool = new Pool({ connectionString: env.serviceDatabaseUrl })

// Обычная роль authenticated — на неё рассчитаны все политики RLS, унаследованные
// от Supabase-версии схемы. Видимость и права на строки решает сама база.
const appPool = new Pool({ connectionString: env.appDatabaseUrl })

export async function serviceQuery(text, params) {
  return servicePool.query(text, params)
}

export async function serviceTx(fn) {
  const client = await servicePool.connect()
  try {
    await client.query('begin')
    const result = await fn(client)
    await client.query('commit')
    return result
  } catch (e) {
    await client.query('rollback')
    throw e
  } finally {
    client.release()
  }
}

/**
 * Все запросы от имени пользователя идут через это: в одной транзакции сначала
 * выставляется request.jwt.claim.sub (его читает auth.uid() в политиках RLS —
 * см. server/sql/000_auth_compat.sql), затем выполняется сам запрос. Так политики,
 * написанные под Supabase, работают на обычном PostgreSQL без единой правки.
 */
export async function withUserContext(userId, fn) {
  const client = await appPool.connect()
  try {
    await client.query('begin')
    await client.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId])
    const result = await fn(client)
    await client.query('commit')
    return result
  } catch (e) {
    await client.query('rollback')
    throw e
  } finally {
    client.release()
  }
}
