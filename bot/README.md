# Raznorab Bot

Telegram-бот для учёта расходов на стройобъекте и выплат рабочим. Работает с той же базой Supabase, что и веб-приложение «Разнораб».

## Возможности

- Привязка Telegram-аккаунта к аккаунту на сайте через одноразовый код.
- Выбор текущего объекта (сохраняется между сессиями).
- Добавление расхода: через кнопки (категория → сумма/описание) или свободным текстом («купил цемент 5 мешков за 4500») — сообщение разбирает Claude.
- Добавление смены: имя рабочего → сумма/дата/часы, либо тоже свободным текстом («заплатил Ивану 2500 за смену»).
- Перед сохранением бот всегда показывает карточку с распознанными данными и просит подтвердить.
- Отчёт по объекту за сегодня/неделю/месяц/всё время: расходы по категориям, выплаты по рабочим, итоги.

## Установка

```bash
cd bot
npm install
cp .env.example .env
```

Заполните `.env`:

| Переменная | Откуда взять |
|---|---|
| `TELEGRAM_BOT_TOKEN` | [@BotFather](https://t.me/BotFather) → `/newbot` |
| `SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API (⚠️ секретный ключ, обходит RLS — не публикуйте и не коммитьте) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/settings/keys) — нужен только для разбора свободного текста, без него работают кнопки |

Перед первым запуском выполните миграцию `../supabase/schema.sql` в SQL Editor вашего Supabase-проекта (там же, где создавались таблицы `objects`/`entries`) — она добавит таблицы `expenses`, `shifts`, `telegram_links`, `telegram_link_codes`.

В веб-приложении задайте `VITE_TELEGRAM_BOT_USERNAME` (юзернейм бота без `@`) — тогда в разделе «Telegram» на сайте появится кнопка мгновенного перехода в бота с кодом.

## Запуск

```bash
npm run dev      # разработка, long-polling с автоперезапуском
npm run build    # сборка в dist/
npm start        # прод-запуск собранной версии
```

Бот использует long-polling (не нужен вебхук/публичный URL), поэтому подойдёт любой процесс, который может работать постоянно.

## Хостинг в проде

Вариант 1 — Railway/Render (проще всего):
1. Создайте новый сервис из этого репозитория, root directory — `bot`.
2. Build command: `npm install && npm run build`, start command: `npm start`.
3. Добавьте переменные окружения из `.env.example`.

Вариант 2 — свой сервер (systemd):

```ini
# /etc/systemd/system/raznorab-bot.service
[Unit]
Description=Raznorab Telegram Bot
After=network.target

[Service]
WorkingDirectory=/opt/raznorab/bot
ExecStart=/usr/bin/node dist/index.js
EnvironmentFile=/opt/raznorab/bot/.env
Restart=always
User=raznorab

[Install]
WantedBy=multi-user.target
```

```bash
npm install && npm run build
sudo systemctl enable --now raznorab-bot
```

## Как это работает изнутри

- `src/lib/auth.ts` — резолвит Telegram-пользователя в запись `telegram_links` через сервисный ключ Supabase и вручную проверяет владение объектом (RLS для service_role не действует).
- `src/session.ts` — состояние диалога (мастер добавления расхода/смены) хранится в памяти процесса и теряется при рестарте — это осознанный компромисс ради простоты; сами данные (объекты/расходы/смены/привязка) всегда в Supabase.
- `src/ai.ts` — вызывает Claude с принудительным tool-use, чтобы получить строго структурированный JSON вместо свободного текста.
- Все входящие данные перед записью в базу показываются пользователю как карточка с кнопками «Сохранить/Отмена» — бот никогда не пишет в базу без подтверждения.
