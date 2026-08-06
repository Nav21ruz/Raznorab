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
}
