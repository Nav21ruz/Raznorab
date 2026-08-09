import jwt from 'jsonwebtoken'
import { env } from '../env.js'

export function signToken(profileId) {
  return jwt.sign({ sub: profileId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
}

export function verifyToken(token) {
  const payload = jwt.verify(token, env.jwtSecret)
  return payload.sub
}
