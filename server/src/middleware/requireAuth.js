import { verifyToken } from '../auth/jwt.js'
import { ApiError } from '../errors.js'

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return next(new ApiError(401, 'Не авторизован'))
  try {
    req.userId = verifyToken(token)
    next()
  } catch {
    next(new ApiError(401, 'Сессия недействительна, войдите заново'))
  }
}

/** Не требует входа, но если токен передан и валиден — подставляет req.userId */
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (token) {
    try {
      req.userId = verifyToken(token)
    } catch {
      /* игнорируем неверный токен — просто остаёмся неавторизованным */
    }
  }
  next()
}
