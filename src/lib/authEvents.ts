/**
 * Общее место для оповещения о смене пользователя — им пользуются и настоящий
 * api.ts, и mockApi.ts, чтобы AuthGate одинаково реагировал на вход/выход
 * независимо от того, работает приложение с реальным сервером или в демо-режиме.
 */
type Listener = () => void
const listeners = new Set<Listener>()

export function onAuthChange(cb: Listener): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function notifyAuthChange() {
  listeners.forEach((cb) => cb())
}
