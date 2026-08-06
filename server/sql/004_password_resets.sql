-- ============================================================
-- Восстановление пароля по email. Своя таблица (не auth_credentials) —
-- токен одноразовый и живёт недолго, отдельная таблица проще чистить
-- и не рискует ничего сломать в основной таблице учётных данных.
-- ============================================================

create table password_resets (
  token text primary key,
  profile_id uuid references profiles on delete cascade not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create index password_resets_profile_idx on password_resets (profile_id);

-- RLS включён, политик нет ни одной — как и auth_credentials, эта таблица
-- доступна только сервисной роли (обходит RLS по владению), обычная роль
-- authenticated к ней не должна иметь доступ вообще: сброс пароля происходит
-- ДО входа, когда auth.uid() ещё не определён — довериться нечему.
alter table password_resets enable row level security;
