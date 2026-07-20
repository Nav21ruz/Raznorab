import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

// service_role: обходит RLS, поэтому все запросы ниже (handlers/*) обязаны
// сами фильтровать по user_id/object_id — это делает lib/auth.ts.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
