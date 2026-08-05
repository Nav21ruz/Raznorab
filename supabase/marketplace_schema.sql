-- ============================================================
-- Стройбиржа: профили, заказы, свайпы, чаты, разнорабочие
-- Выполнить в Supabase SQL Editor после schema.sql (журнал объекта)
-- ============================================================

-- Профиль пользователя мини-аппа (создаётся при первом входе через Telegram)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  telegram_id bigint unique,
  telegram_username text,
  first_name text not null default '',
  last_name text,
  photo_url text,
  phone text,
  city text,
  role text check (role in ('customer', 'builder', 'laborer')),
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "profiles are publicly readable" on profiles for select using (true);
create policy "user can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "user can update own profile" on profiles for update using (auth.uid() = id);

-- Расширенный профиль строителя (портфолио, специализация, цены)
create table builder_profiles (
  id uuid primary key references profiles on delete cascade,
  specialties text[] not null default '{}',
  experience_years int,
  about text,
  price_from int,
  price_to int,
  portfolio_photos text[] not null default '{}',
  is_active boolean not null default true
);

alter table builder_profiles enable row level security;

create policy "builder profiles are publicly readable" on builder_profiles for select using (true);
create policy "builder manages own profile" on builder_profiles for insert with check (auth.uid() = id);
create policy "builder updates own profile" on builder_profiles for update using (auth.uid() = id);

-- Заказы (объекты/работы), которые публикуют заказчики — колода для свайпа строителей
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles on delete cascade not null,
  category text not null,
  title text not null,
  description text not null,
  budget_from int,
  budget_to int,
  city text,
  address text,
  photos text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'in_progress', 'done', 'cancelled')),
  created_at timestamptz default now()
);

alter table orders enable row level security;

create policy "orders are publicly readable" on orders for select using (true);
create policy "customer creates own orders" on orders for insert with check (auth.uid() = customer_id);
create policy "customer updates own orders" on orders for update using (auth.uid() = customer_id);
create policy "customer deletes own orders" on orders for delete using (auth.uid() = customer_id);

-- Свайпы строителей по заказам (лайк = отклик, пасс = пропуск)
create table order_swipes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders on delete cascade not null,
  builder_id uuid references profiles on delete cascade not null,
  direction text not null check (direction in ('like', 'pass')),
  -- заказчик посмотрел отклик строителя и принял решение (мэтч или отказ) —
  -- нужно, чтобы разобранные отклики не показывались в списке кандидатов повторно
  reviewed_by_customer boolean not null default false,
  created_at timestamptz default now(),
  unique (order_id, builder_id)
);

alter table order_swipes enable row level security;

-- строитель видит свои свайпы, заказчик видит отклики по своим заказам
create policy "builder reads own swipes" on order_swipes for select using (
  auth.uid() = builder_id
  or exists (select 1 from orders o where o.id = order_swipes.order_id and o.customer_id = auth.uid())
);
create policy "builder creates own swipes" on order_swipes for insert with check (
  auth.uid() = builder_id
  and not exists (select 1 from orders o where o.id = order_swipes.order_id and o.customer_id = auth.uid())
);
create policy "builder updates own swipes" on order_swipes for update using (auth.uid() = builder_id);
create policy "customer marks swipe reviewed" on order_swipes for update using (
  exists (select 1 from orders o where o.id = order_swipes.order_id and o.customer_id = auth.uid())
);

-- Разнорабочие: простые разовые задачи от заказчиков (без свайпов, лента + отклик)
create table labor_tasks (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles on delete cascade not null,
  title text not null,
  description text not null,
  city text,
  pay_amount int,
  pay_type text not null default 'per_task' check (pay_type in ('per_task', 'per_day', 'per_hour')),
  date_needed date,
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz default now()
);

alter table labor_tasks enable row level security;

create policy "labor tasks are publicly readable" on labor_tasks for select using (true);
create policy "customer creates own labor tasks" on labor_tasks for insert with check (auth.uid() = customer_id);
create policy "customer updates own labor tasks" on labor_tasks for update using (auth.uid() = customer_id);
create policy "customer deletes own labor tasks" on labor_tasks for delete using (auth.uid() = customer_id);

-- Отклики разнорабочих на задачи
create table labor_responses (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references labor_tasks on delete cascade not null,
  laborer_id uuid references profiles on delete cascade not null,
  message text,
  created_at timestamptz default now(),
  unique (task_id, laborer_id)
);

alter table labor_responses enable row level security;

create policy "laborer reads own responses, customer reads task responses" on labor_responses for select using (
  auth.uid() = laborer_id
  or exists (select 1 from labor_tasks t where t.id = labor_responses.task_id and t.customer_id = auth.uid())
);
create policy "laborer creates own response" on labor_responses for insert with check (auth.uid() = laborer_id);
create policy "laborer deletes own response" on labor_responses for delete using (auth.uid() = laborer_id);

-- Чаты (создаются при мэтче: заказ + отклик строителя, либо принятый отклик разнорабочего)
create table conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('order', 'labor')),
  order_id uuid references orders on delete cascade,
  labor_task_id uuid references labor_tasks on delete cascade,
  customer_id uuid references profiles on delete cascade not null,
  worker_id uuid references profiles on delete cascade not null,
  created_at timestamptz default now(),
  unique (order_id, worker_id),
  unique (labor_task_id, worker_id)
);

alter table conversations enable row level security;

create policy "participants read conversation" on conversations for select using (
  auth.uid() = customer_id or auth.uid() = worker_id
);

-- Чат можно создать, только подтверждая уже существующий встречный интерес:
-- заказчик подтверждает отклик строителя на СВОЙ заказ, либо отклик разнорабочего на СВОЮ задачу.
-- Это не даёт писать незнакомым пользователям в обход свайпов/откликов.
create policy "customer confirms real match to create conversation" on conversations for insert with check (
  auth.uid() = customer_id
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

-- Сообщения в чате
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations on delete cascade not null,
  sender_id uuid references profiles on delete cascade not null,
  text text not null,
  created_at timestamptz default now()
);

alter table messages enable row level security;

create policy "participants read messages" on messages for select using (
  exists (
    select 1 from conversations c
    where c.id = messages.conversation_id
    and (c.customer_id = auth.uid() or c.worker_id = auth.uid())
  )
);
create policy "participants send messages" on messages for insert with check (
  auth.uid() = sender_id
  and exists (
    select 1 from conversations c
    where c.id = messages.conversation_id
    and (c.customer_id = auth.uid() or c.worker_id = auth.uid())
  )
);

-- Индексы для лент и списков
create index orders_status_created_idx on orders (status, created_at desc);
create index labor_tasks_status_created_idx on labor_tasks (status, created_at desc);
create index order_swipes_builder_idx on order_swipes (builder_id);
create index messages_conversation_created_idx on messages (conversation_id, created_at);

-- Realtime для чата
alter publication supabase_realtime add table messages;

-- Storage bucket для фото заказов, портфолио и задач (выполнить вручную в Dashboard → Storage)
-- Bucket name: marketplace-photos, public: true
