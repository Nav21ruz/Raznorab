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
