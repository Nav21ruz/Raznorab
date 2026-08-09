-- ============================================================
-- Логин по email/паролю — в Supabase этим занимается auth.users, здесь своя таблица.
-- Telegram-пользователям она не нужна: их узнают по profiles.telegram_id,
-- который проверяется подписью Telegram (initData), а не паролем.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists auth_credentials (
  profile_id uuid primary key references profiles(id) on delete cascade,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- RLS включён, но политик НЕТ ни одной — таблица недоступна вообще никому, кто
-- подключается как обычный пользователь (роль authenticated), только сервисной
-- роли сервера (с BYPASSRLS). То же соображение, что и с banned_users: хэши
-- паролей не должны быть достижимы ни через какую случайную дыру в политиках.
alter table auth_credentials enable row level security;
