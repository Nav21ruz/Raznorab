-- ============================================================
-- В Supabase роль authenticated получает права на все таблицы автоматически.
-- На обычном PostgreSQL это нужно выдать явно — иначе RLS не при чём, запрос
-- отклоняется раньше, на уровне обычных прав доступа. Выполнять ПОСЛЕДНИМ,
-- после всех схем (marketplace/moderation/performance).
-- ============================================================

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- на случай, если сервисная роль позже создаст ещё таблицы — права выдаются сразу
alter default privileges for role raznorab_service in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges for role raznorab_service in schema public
  grant usage, select on sequences to authenticated;
