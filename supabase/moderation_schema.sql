-- ============================================================
-- Модерация: админы, баны, фильтр цензуры, жалобы
-- Выполнить после marketplace_schema.sql
-- ============================================================

-- Список админов. НЕ содержит self-service insert/update/delete —
-- первого админа нужно добавить вручную через Supabase SQL Editor:
--   insert into admins (profile_id) values ('<ваш profiles.id>');
-- (id можно найти в таблице profiles по telegram_id/telegram_username после первого входа в мини-апп)
create table admins (
  profile_id uuid primary key references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

alter table admins enable row level security;

-- ВАЖНО: политика проверяет только СВОЮ строку (auth.uid() = profile_id), а не
-- exists(select from admins ...) — иначе Postgres уходит в бесконечную рекурсию,
-- пытаясь применить эту же RLS-политику к своей же подзапросной проверке.
-- Для клиента этого достаточно: "есть ли у меня строка в admins" == "я админ".
create policy "user checks own admin membership" on admins for select using (
  auth.uid() = profile_id
);

-- Баны пользователей — отдельная таблица (не колонка в profiles!), иначе
-- забаненный пользователь мог бы сам себе снять бан через "update own profile".
create table banned_users (
  profile_id uuid primary key references profiles(id) on delete cascade,
  reason text,
  banned_by uuid references profiles(id),
  banned_at timestamptz default now()
);

alter table banned_users enable row level security;

create policy "user checks own ban status, admin reads all" on banned_users for select using (
  auth.uid() = profile_id
  or exists (select 1 from admins a where a.profile_id = auth.uid())
);
create policy "admin bans users" on banned_users for insert with check (
  exists (select 1 from admins a where a.profile_id = auth.uid())
);
create policy "admin unbans users" on banned_users for delete using (
  exists (select 1 from admins a where a.profile_id = auth.uid())
);

-- Стоп-слова для фильтра цензуры. Паттерны — POSIX-регулярки (см. mask_profanity ниже),
-- регистронезависимые. Список пуст по умолчанию — наполняется через админ-панель
-- в соответствии с вашей собственной политикой модерации.
create table banned_words (
  id uuid primary key default gen_random_uuid(),
  pattern text not null unique,
  created_at timestamptz default now()
);

alter table banned_words enable row level security;

-- читать список могут все (нужно клиенту для мгновенной проверки при вводе текста),
-- редактировать — только админы
create policy "banned words are publicly readable" on banned_words for select using (true);
create policy "admin manages banned words" on banned_words for insert with check (
  exists (select 1 from admins a where a.profile_id = auth.uid())
);
create policy "admin updates banned words" on banned_words for update using (
  exists (select 1 from admins a where a.profile_id = auth.uid())
);
create policy "admin deletes banned words" on banned_words for delete using (
  exists (select 1 from admins a where a.profile_id = auth.uid())
);

-- Автоматическая маскировка текста по списку стоп-слов — работает на уровне БД,
-- поэтому её нельзя обойти прямыми запросами к API в обход интерфейса.
create or replace function mask_profanity(input text) returns text as $$
declare
  rec record;
  result text := input;
begin
  if input is null then
    return input;
  end if;
  for rec in select pattern from banned_words loop
    result := regexp_replace(result, rec.pattern, '***', 'gi');
  end loop;
  return result;
end;
$$ language plpgsql stable;

create or replace function moderate_orders() returns trigger as $$
begin
  new.title := mask_profanity(new.title);
  new.description := mask_profanity(new.description);
  return new;
end;
$$ language plpgsql;

create trigger orders_moderate_trigger
  before insert or update on orders
  for each row execute function moderate_orders();

create or replace function moderate_labor_tasks() returns trigger as $$
begin
  new.title := mask_profanity(new.title);
  new.description := mask_profanity(new.description);
  return new;
end;
$$ language plpgsql;

create trigger labor_tasks_moderate_trigger
  before insert or update on labor_tasks
  for each row execute function moderate_labor_tasks();

create or replace function moderate_messages() returns trigger as $$
begin
  new.text := mask_profanity(new.text);
  return new;
end;
$$ language plpgsql;

create trigger messages_moderate_trigger
  before insert on messages
  for each row execute function moderate_messages();

create or replace function moderate_builder_profiles() returns trigger as $$
begin
  new.about := mask_profanity(new.about);
  return new;
end;
$$ language plpgsql;

create trigger builder_profiles_moderate_trigger
  before insert or update on builder_profiles
  for each row execute function moderate_builder_profiles();

-- Жалобы на объявления (заказы, задачи разнорабочих) и на пользователей
create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete cascade not null,
  target_type text not null check (target_type in ('order', 'labor_task', 'profile')),
  target_id uuid not null,
  reason text not null,
  comment text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed', 'actioned')),
  created_at timestamptz default now()
);

alter table reports enable row level security;

create policy "user creates own report" on reports for insert with check (
  auth.uid() = reporter_id
  and not exists (select 1 from banned_users where profile_id = auth.uid())
);
create policy "reporter reads own reports, admin reads all" on reports for select using (
  auth.uid() = reporter_id
  or exists (select 1 from admins a where a.profile_id = auth.uid())
);
create policy "admin updates report status" on reports for update using (
  exists (select 1 from admins a where a.profile_id = auth.uid())
);

create index reports_status_created_idx on reports (status, created_at desc);

-- Забаненные пользователи не могут публиковать новый контент (сами объекты видимы всем,
-- существующий контент не скрывается автоматически — при необходимости админ удаляет его вручную)
alter policy "customer creates own orders" on orders with check (
  auth.uid() = customer_id and not exists (select 1 from banned_users where profile_id = auth.uid())
);
alter policy "customer creates own labor tasks" on labor_tasks with check (
  auth.uid() = customer_id and not exists (select 1 from banned_users where profile_id = auth.uid())
);
alter policy "builder creates own swipes" on order_swipes with check (
  auth.uid() = builder_id
  and not exists (select 1 from orders o where o.id = order_swipes.order_id and o.customer_id = auth.uid())
  and not exists (select 1 from banned_users where profile_id = auth.uid())
);
alter policy "laborer creates own response" on labor_responses with check (
  auth.uid() = laborer_id and not exists (select 1 from banned_users where profile_id = auth.uid())
);
alter policy "participants send messages" on messages with check (
  auth.uid() = sender_id
  and exists (
    select 1 from conversations c
    where c.id = messages.conversation_id
    and (c.customer_id = auth.uid() or c.worker_id = auth.uid())
  )
  and not exists (select 1 from banned_users where profile_id = auth.uid())
);
alter policy "customer confirms real match to create conversation" on conversations with check (
  auth.uid() = customer_id
  and not exists (select 1 from banned_users where profile_id = auth.uid())
  and (
    (
      kind = 'order'
      and order_id is not null
      and labor_task_id is null
      and exists (select 1 from orders o where o.id = conversations.order_id and o.customer_id = auth.uid())
      and exists (
        select 1 from order_swipes s
        where s.order_id = conversations.order_id and s.builder_id = conversations.worker_id and s.direction = 'like'
      )
    )
    or (
      kind = 'labor'
      and labor_task_id is not null
      and order_id is null
      and exists (select 1 from labor_tasks t where t.id = conversations.labor_task_id and t.customer_id = auth.uid())
      and exists (
        select 1 from labor_responses r
        where r.task_id = conversations.labor_task_id and r.laborer_id = conversations.worker_id
      )
    )
  )
);
