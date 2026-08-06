-- ============================================================
-- Уведомления: непрочитанные сообщения в чатах + новые отклики на
-- заказы/задачи, которые заказчик ещё не видел.
-- ============================================================

-- До какого момента каждый участник прочитал переписку — своя строка на
-- каждого, видна и изменяема только самим собой (не нужна собеседнику и
-- не должна быть видна кому-то ещё).
create table conversation_reads (
  conversation_id uuid references conversations on delete cascade not null,
  profile_id uuid references profiles on delete cascade not null,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

alter table conversation_reads enable row level security;

create policy "own read state only" on conversation_reads
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create index conversation_reads_conv_idx on conversation_reads (conversation_id);

-- Подсчёт непрочитанных сообщений в списке чатов идёт по (conversation_id, created_at)
-- на каждый чат пользователя — без индекса это full scan таблицы messages целиком.
create index if not exists messages_conversation_created_idx on messages (conversation_id, created_at);

-- Видел ли заказчик уже этот отклик разнорабочего на свою задачу — аналог
-- reviewed_by_customer у order_swipes, но там это "принял/отклонил", здесь
-- достаточно факта показа на экране (принять можно и после повторного просмотра).
alter table labor_responses add column seen_by_customer boolean not null default false;

-- Раньше на labor_responses не было ни одной update-политики (не требовалось —
-- отклики только создавались/удалялись); заказчику нужно право отметить
-- отклики на СВОЮ задачу просмотренными — так же уже устроено со свайпами заказов.
create policy "customer marks response seen" on labor_responses for update using (
  exists (select 1 from labor_tasks t where t.id = labor_responses.task_id and t.customer_id = auth.uid())
);
