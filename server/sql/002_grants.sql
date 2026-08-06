-- ============================================================
-- В Supabase роль authenticated получает права на все таблицы автоматически.
-- На обычном PostgreSQL это нужно выдать явно — иначе RLS не при чём, запрос
-- отклоняется раньше, на уровне обычных прав доступа. Выполнять ПОСЛЕДНИМ,
-- после всех схем (marketplace/moderation/performance).
--
-- Файл не содержит имени роли-владельца явно — использует current_user (того,
-- кто сейчас выполняет этот файл), поэтому подходит для любого имени пользователя
-- базы данных, каким бы его ни назначил хостинг (например, Яндекс Managed PostgreSQL).
-- ============================================================

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- на случай, если владелец схемы позже создаст ещё таблицы — права выдаются сразу
do $$
begin
  execute format('alter default privileges for role %I in schema public grant select, insert, update, delete on tables to authenticated', current_user);
  execute format('alter default privileges for role %I in schema public grant usage, select on sequences to authenticated', current_user);
end $$;
