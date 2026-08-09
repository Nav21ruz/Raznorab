import 'dotenv/config'

function required(name, fallback) {
  const v = process.env[name] ?? fallback
  if (v === undefined) throw new Error(`Не задана переменная окружения ${name}`)
  return v
}

export const env = {
  // Две разные строки подключения к ОДНОЙ базе: SERVICE — от имени служебной роли
  // (bypass RLS, только для регистрации/логина), APP — от имени обычной роли
  // authenticated, на которую и рассчитаны все политики RLS.
  serviceDatabaseUrl: required('SERVICE_DATABASE_URL'),
  appDatabaseUrl: required('APP_DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  port: Number(process.env.PORT ?? 8787),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  s3: {
    endpoint: process.env.S3_ENDPOINT ?? '',
    region: process.env.S3_REGION ?? 'ru-central1',
    bucket: process.env.S3_BUCKET ?? '',
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? '',
  },
  yandex: {
    // client_id не секретен (виден в адресе браузера при входе), client_secret — секретен,
    // используется только здесь, на сервере, никогда не отдаётся фронтенду
    clientId: process.env.YANDEX_CLIENT_ID ?? '',
    clientSecret: process.env.YANDEX_CLIENT_SECRET ?? '',
  },
  // Адрес сайта — нужен, чтобы вставить в письмо правильную ссылку для сброса пароля
  siteUrl: (process.env.SITE_URL ?? '').replace(/\/$/, ''),
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASSWORD ?? '',
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? '',
  },
}
