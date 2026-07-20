-- Объекты строительства
create table objects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  address text not null,
  start_date date not null,
  description text,
  created_at timestamptz default now()
);

alter table objects enable row level security;
create policy "owner only" on objects for all using (auth.uid() = user_id);

-- Записи журнала
create table entries (
  id uuid primary key default gen_random_uuid(),
  object_id uuid references objects on delete cascade not null,
  date date not null,
  weather text not null default 'sunny',
  temperature int,
  work_description text not null,
  notes text,
  created_at timestamptz default now()
);

alter table entries enable row level security;
create policy "object owner" on entries for all using (
  exists (select 1 from objects where id = entries.object_id and user_id = auth.uid())
);

-- Рабочие в записи
create table entry_workers (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries on delete cascade not null,
  name text not null,
  hours int not null default 8
);

alter table entry_workers enable row level security;
create policy "entry owner" on entry_workers for all using (
  exists (
    select 1 from entries e
    join objects o on o.id = e.object_id
    where e.id = entry_workers.entry_id and o.user_id = auth.uid()
  )
);

-- Фотографии в записи
create table entry_photos (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries on delete cascade not null,
  storage_path text not null,
  caption text
);

alter table entry_photos enable row level security;
create policy "entry owner" on entry_photos for all using (
  exists (
    select 1 from entries e
    join objects o on o.id = e.object_id
    where e.id = entry_photos.entry_id and o.user_id = auth.uid()
  )
);

-- Токены шаринга (публичный read-only)
create table share_tokens (
  id uuid primary key default gen_random_uuid(),
  object_id uuid references objects on delete cascade not null,
  token text unique not null,
  expires_at timestamptz
);

alter table share_tokens enable row level security;

-- Владелец может создавать токены
create policy "owner create" on share_tokens for insert with check (
  exists (select 1 from objects where id = share_tokens.object_id and user_id = auth.uid())
);

-- Любой может читать токены (для публичных ссылок)
create policy "public read" on share_tokens for select using (true);

-- Публичный read для объектов по share-токену (через отдельную политику)
create policy "shared read" on objects for select using (
  auth.uid() = user_id
  or exists (select 1 from share_tokens where object_id = objects.id)
);

-- Публичный read для entries по share-токену
create policy "shared read" on entries for select using (
  exists (select 1 from objects o where o.id = entries.object_id and o.user_id = auth.uid())
  or exists (select 1 from share_tokens st where st.object_id = entries.object_id)
);

-- Публичный read для workers и photos по share-токену
create policy "shared read" on entry_workers for select using (
  exists (
    select 1 from entries e
    join objects o on o.id = e.object_id
    where e.id = entry_workers.entry_id
    and (o.user_id = auth.uid() or exists (select 1 from share_tokens st where st.object_id = o.id))
  )
);

create policy "shared read" on entry_photos for select using (
  exists (
    select 1 from entries e
    join objects o on o.id = e.object_id
    where e.id = entry_photos.entry_id
    and (o.user_id = auth.uid() or exists (select 1 from share_tokens st where st.object_id = o.id))
  )
);

-- Storage bucket для фотографий (выполнить вручную в Dashboard → Storage)
-- Bucket name: entry-photos, public: true

-- =========================================================
-- Учёт расходов и смен (веб + телеграм-бот)
-- =========================================================

-- Расходы на объекте (материалы, инструменты, транспорт и т.д.)
create table expenses (
  id uuid primary key default gen_random_uuid(),
  object_id uuid references objects on delete cascade not null,
  date date not null default current_date,
  amount numeric(12, 2) not null check (amount > 0),
  category text not null default 'other',
  description text,
  source text not null default 'web',
  created_at timestamptz default now()
);

alter table expenses enable row level security;
create policy "object owner" on expenses for all using (
  exists (select 1 from objects where id = expenses.object_id and user_id = auth.uid())
);

-- Смены рабочих (отдельный учёт выплат, не привязан к записям журнала)
create table shifts (
  id uuid primary key default gen_random_uuid(),
  object_id uuid references objects on delete cascade not null,
  worker_name text not null,
  date date not null default current_date,
  amount numeric(12, 2) not null check (amount >= 0),
  hours numeric(4, 1),
  paid boolean not null default false,
  notes text,
  source text not null default 'web',
  created_at timestamptz default now()
);

alter table shifts enable row level security;
create policy "object owner" on shifts for all using (
  exists (select 1 from objects where id = shifts.object_id and user_id = auth.uid())
);

-- Привязка телеграм-аккаунта к пользователю приложения
create table telegram_links (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint unique not null,
  telegram_chat_id bigint not null,
  user_id uuid references auth.users not null,
  current_object_id uuid references objects on delete set null,
  linked_at timestamptz default now()
);

alter table telegram_links enable row level security;
create policy "owner only" on telegram_links for all using (auth.uid() = user_id);

-- Одноразовые коды для привязки бота (генерируются в веб-приложении)
create table telegram_link_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  user_id uuid references auth.users not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

alter table telegram_link_codes enable row level security;
create policy "owner only" on telegram_link_codes for all using (auth.uid() = user_id);

-- Примечание: бот работает через service_role ключ и сам проверяет
-- принадлежность объектов пользователю, поэтому RLS выше защищает
-- только прямой доступ из веб-приложения (anon/authenticated ключ).
