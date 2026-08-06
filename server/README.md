# Raznorab API — сервер для Стройбиржи (без Supabase)

Небольшой Node.js/Express-сервер, который заменяет Supabase: авторизация
(email/пароль + вход через Telegram), заказы, разнорабочие, чат (опросом,
не WebSocket), жалобы, админка, подпись ссылок для загрузки фото.

Рассчитан на PostgreSQL — как настоящий (Яндекс Managed PostgreSQL), так
и локальный, для разработки. Схема базы (`../supabase/*.sql`) написана
под Supabase (использует `auth.uid()` и политики RLS) — `sql/000_auth_compat.sql`
добавляет такую же функцию `auth.uid()` поверх обычного PostgreSQL, поэтому
схему не пришлось переписывать.

## Архитектура одним абзацем

Два разных подключения к одной базе. `SERVICE_DATABASE_URL` — от имени
владельца схемы (он же и создал все таблицы при загрузке SQL-файлов —
владелец таблицы всегда обходит RLS, доп. права не нужны), используется
только в `src/routes/auth.js` для регистрации/входа. `APP_DATABASE_URL` —
от имени обычной роли `authenticated`, на каждый запрос выставляется
`request.jwt.claim.sub` (id пользователя из JWT), и дальше all the
security enforcement делает сама база через политики RLS — ровно так же,
как это делает Supabase/PostgREST.

## Порядок SQL-файлов (важно соблюсти)

```
sql/000_auth_compat.sql
../supabase/marketplace_schema.sql
../supabase/moderation_schema.sql
sql/001_auth_credentials.sql
../supabase/performance_schema.sql
sql/002_grants.sql
```

Все выполняются от имени ОДНОГО пользователя — того, кто станет
владельцем схемы (`SERVICE_DATABASE_URL`).

## Переменные окружения

См. `.env.example`. `SERVICE_DATABASE_URL`/`APP_DATABASE_URL` — два
разных пользователя к одной базе (второго нужно создать отдельно и
выполнить `grant authenticated to <имя_app_пользователя>;`). `JWT_SECRET` —
любая длинная случайная строка. `TELEGRAM_BOT_TOKEN` — из @BotFather,
нужен только для входа через Telegram Mini App. `S3_*` — Яндекс Object
Storage (S3-совместимо) для фото.

## Локальный запуск

```
npm install
cp .env.example .env   # заполнить своими значениями
npm run dev
```

## Деплой как Yandex Cloud Function

Точка входа — `src/yandex-handler.js` (экспорт `handler`), оборачивает
тот же Express-код через `serverless-http` (формат события у Yandex
Cloud Functions совместим с Amazon API Gateway proxy integration).
Пакуется вместе с `node_modules` (у serverless-функций Яндекса нет
отдельного шага `npm install` при деплое):

```
cd server
npm install --omit=dev
zip -r function.zip . -x ".env" -x "*.git*"
```

Дальше — загрузить `function.zip` в консоли Yandex Cloud Functions,
runtime Node.js, точка входа `src/yandex-handler.handler`, прописать
переменные окружения из `.env.example`. Подробный пошаговый гайд для
не-программиста — см. корень репозитория,
`ИНСТРУКЦИЯ-ЯНДЕКС-ОБЛАКО.txt`.
