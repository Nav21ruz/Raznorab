-- ============================================================
-- Отзывы и рейтинги — заказчик и исполнитель оценивают друг друга
-- после того, как нашли друг друга (открылся чат).
-- Выполнить после marketplace_schema.sql И moderation_schema.sql
-- (нужна функция mask_profanity из второго файла).
-- ============================================================

create table reviews (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations on delete cascade not null,
  reviewer_id uuid references profiles on delete cascade not null,
  reviewee_id uuid references profiles on delete cascade not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  -- один отзыв на переписку от каждой стороны — не заспамить чужой рейтинг повторными оценками
  unique (conversation_id, reviewer_id)
);

alter table reviews enable row level security;

-- Рейтинг должен быть виден любому, кто рассматривает исполнителя/заказчика —
-- в этом весь смысл отзывов, поэтому читать может кто угодно.
create policy "reviews are publicly readable" on reviews for select using (true);

-- Оставить отзыв может только участник переписки, и только на ВТОРОГО участника
-- этой же переписки (не на себя и не на постороннего) — иначе первый попавшийся
-- conversation_id позволил бы оценить кого угодно.
create policy "participant reviews the other side" on reviews for insert with check (
  auth.uid() = reviewer_id
  and not exists (select 1 from banned_users where profile_id = auth.uid())
  and exists (
    select 1 from conversations c
    where c.id = reviews.conversation_id
      and (
        (c.customer_id = auth.uid() and c.worker_id = reviews.reviewee_id)
        or (c.worker_id = auth.uid() and c.customer_id = reviews.reviewee_id)
      )
  )
);

-- Отзывы неизменяемы — ни update, ни delete-политики нет ни для кого, включая
-- автора: иначе можно было бы задним числом скрыть неудобную честную оценку.

create index reviews_reviewee_idx on reviews (reviewee_id, created_at desc);

-- Текст отзыва проходит тот же фильтр цензуры, что и остальной пользовательский контент.
-- Отдельная функция (а не moderate_messages) — у этой таблицы колонка называется
-- comment, а не text.
create or replace function moderate_reviews() returns trigger as $$
begin
  new.comment := mask_profanity(new.comment);
  return new;
end;
$$ language plpgsql;

create trigger reviews_moderate_trigger
  before insert on reviews
  for each row execute function moderate_reviews();
