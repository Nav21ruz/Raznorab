/**
 * crypto.randomUUID существует только в "безопасном контексте" (https или
 * localhost) — на обычном http браузер его не даёт, и код падает с
 * "crypto.randomUUID is not a function". Здесь — запасной генератор на случай,
 * если сайт открыли без https или в старом браузере.
 */
export function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
