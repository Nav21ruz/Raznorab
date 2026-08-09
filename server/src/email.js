import nodemailer from 'nodemailer'
import { env } from './env.js'

let transporter = null

function getTransporter() {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.password) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.password },
    })
  }
  return transporter
}

export async function sendPasswordResetEmail(toEmail, resetUrl) {
  const t = getTransporter()
  if (!t) {
    // Не настроено (SMTP_* не заполнены) — не роняем запрос пользователя из-за
    // этого, но обязательно оставляем след в логах сервера, иначе никто не
    // узнает, что письма тихо не отправляются.
    console.error('[email] SMTP не настроен — письмо для сброса пароля не отправлено:', toEmail)
    return
  }
  await t.sendMail({
    from: env.smtp.from,
    to: toEmail,
    subject: 'Восстановление пароля — Briggo',
    text: `Для сброса пароля перейдите по ссылке (действует 1 час): ${resetUrl}\n\nЕсли вы не запрашивали сброс пароля — просто проигнорируйте это письмо.`,
    html: `<p>Для сброса пароля перейдите по ссылке (действует 1 час):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.</p>`,
  })
}
