-- ============================================================
-- Совместимость с политиками RLS, написанными под Supabase.
-- Обычный (не Supabase) PostgreSQL — в том числе Яндекс Managed PostgreSQL —
-- не имеет схемы auth и функции auth.uid(). Политики в marketplace_schema.sql /
-- moderation_schema.sql ссылаются на auth.uid() напрямую, поэтому создаём
-- такую же функцию сами: она читает id пользователя из переменной сессии,
-- которую наш сервер выставляет на каждый запрос после проверки JWT
-- (см. server/src/db.js — withUserContext).
-- Выполнять этот файл ПЕРВЫМ, до marketplace_schema.sql.
-- ============================================================

create schema if not exists auth;

-- marketplace_schema.sql делает "profiles.id references auth.users" — в Supabase эта
-- таблица служебная и полна лишних колонок, нам нужен только сам факт существования
-- строки с этим id. Наш сервер вставляет сюда строку при регистрации нового
-- пользователя, до вставки в profiles.
create table if not exists auth.users (
  id uuid primary key
);

create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

-- Роли-группы для читаемости прав доступа (как в Supabase):
--   authenticated — обычный вошедший пользователь, на него действуют RLS-политики.
--   anon          — не используется напрямую (все запросы идут только через наш
--                    сервер), но на неё ссылается performance_schema.sql.
-- Настоящую роль подключения к БД (например, raznorab_app) нужно сделать членом
-- authenticated — см. server/sql/README.md.
-- ADMIN <текущая роль> — чтобы тот, кто выполняет этот файл (сервисная роль),
-- сразу мог сам выдавать/забирать членство в authenticated другим ролям
-- (иначе понадобится отдельно логиниться суперпользователем).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute format('create role authenticated nologin admin %I', current_user);
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    execute format('create role anon nologin admin %I', current_user);
  end if;
end $$;
