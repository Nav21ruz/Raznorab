-- ============================================================
-- Производительность: индексы и представление для списка чатов
-- Выполнить после marketplace_schema.sql и moderation_schema.sql
-- ============================================================

-- ---------- Индексы ----------
-- Политики RLS выполняют exists(select ... where customer_id = auth.uid()) и подобное
-- на КАЖДУЮ строку КАЖДОГО запроса. Без индексов по этим колонкам деградирует всё,
-- включая чат. Часть индексов уже есть (см. marketplace_schema.sql) — здесь недостающие.

create index if not exists orders_customer_idx on orders (customer_id, created_at desc);
create index if not exists labor_tasks_customer_idx on labor_tasks (customer_id, created_at desc);

create index if not exists conversations_customer_idx on conversations (customer_id);
create index if not exists conversations_worker_idx on conversations (worker_id);

create index if not exists labor_responses_task_idx on labor_responses (task_id);
create index if not exists labor_responses_laborer_idx on labor_responses (laborer_id, created_at desc);

create index if not exists reports_reporter_idx on reports (reporter_id);

-- Лента строителя: активные заказы, которые он ещё не свайпал
create index if not exists order_swipes_order_reviewed_idx
  on order_swipes (order_id, direction, reviewed_by_customer);

-- Поиск пользователей в админке по подстроке без учёта регистра.
-- Обычный btree-индекс для ilike '%...%' не работает, нужен триграммный.
create extension if not exists pg_trgm;
create index if not exists profiles_first_name_trgm_idx on profiles using gin (first_name gin_trgm_ops);
create index if not exists profiles_city_trgm_idx on profiles using gin (city gin_trgm_ops);
create index if not exists profiles_username_trgm_idx on profiles using gin (telegram_username gin_trgm_ops);
create index if not exists profiles_phone_trgm_idx on profiles using gin (phone gin_trgm_ops);

-- ---------- Последнее сообщение в каждом чате ----------
-- Раньше список чатов выкачивал ВСЕ сообщения всех бесед, чтобы показать по одной
-- строчке превью. Теперь БД сама отдаёт по одному последнему сообщению на чат.
create or replace view conversation_last_messages as
select distinct on (conversation_id)
  conversation_id,
  id as message_id,
  sender_id,
  text,
  created_at
from messages
order by conversation_id, created_at desc;

-- Представление должно проверять права ТОГО, КТО СПРАШИВАЕТ, а не владельца
-- представления — иначе через него можно было бы прочитать чужую переписку.
alter view conversation_last_messages set (security_invoker = on);

-- Роли authenticated/anon создаёт сам Supabase. Проверяем их наличие, чтобы файл
-- можно было выполнить и на чистом Postgres (например, при локальной отладке).
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on conversation_last_messages to authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on conversation_last_messages to anon;
  end if;
end $$;
