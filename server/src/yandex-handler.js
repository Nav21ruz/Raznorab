// Точка входа для Yandex Cloud Functions. HTTP-триггер Яндекса передаёт событие
// в формате, совместимом с AWS API Gateway proxy integration, поэтому подходит
// стандартный адаптер serverless-http — тот же Express-код работает и как обычный
// сервер (см. server.js для VPS), и как serverless-функция.
import serverlessHttp from 'serverless-http'
import { app } from './app.js'

const wrapped = serverlessHttp(app)

export async function handler(event, context) {
  return wrapped(event, context)
}
