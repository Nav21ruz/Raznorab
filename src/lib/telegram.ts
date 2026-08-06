import type { WebApp as WebAppType, WebAppUser } from '@twa-dev/types'

declare global {
  interface Window {
    Telegram?: { WebApp: WebAppType }
  }
}

const DEV_USER: WebAppUser = {
  id: 100000001,
  first_name: 'Тест',
  last_name: 'Пользователь',
  username: 'test_user',
  photo_url: undefined,
}

function noop() {}

function buildMockWebApp(): WebAppType {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>()
  return {
    isExpanded: true,
    viewportHeight: window.innerHeight,
    viewportStableHeight: window.innerHeight,
    platform: 'unknown',
    version: '7.0',
    themeParams: {
      bg_color: '#0f1117',
      secondary_bg_color: '#161923',
      text_color: '#e5e7eb',
      hint_color: '#6b7280',
      link_color: '#f97316',
      button_color: '#f97316',
      button_text_color: '#ffffff',
      header_bg_color: '#0f1117',
      accent_text_color: '#f97316',
      section_bg_color: '#161923',
      section_header_text_color: '#9ca3af',
      subtitle_text_color: '#9ca3af',
      destructive_text_color: '#ef4444',
      section_separator_color: '#1f2430',
      bottom_bar_bg_color: '#0f1117',
    },
    initDataUnsafe: { auth_date: Math.floor(Date.now() / 1000), hash: 'dev', signature: 'dev', user: DEV_USER },
    initData: '',
    colorScheme: 'dark',
    onEvent: ((event: string, cb: (...args: unknown[]) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(cb)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any,
    offEvent: ((event: string, cb: (...args: unknown[]) => void) => {
      listeners.get(event)?.delete(cb)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any,
    close: noop,
    expand: noop,
    isVersionAtLeast: () => true,
    openLink: (url: string) => window.open(url, '_blank'),
    openTelegramLink: (url: string) => window.open(url, '_blank'),
    setHeaderColor: noop,
    setBackgroundColor: noop,
    showConfirm: (message: string, cb?: (ok: boolean) => unknown) => cb?.(window.confirm(message)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    showPopup: ((_params: unknown, cb?: (id?: string) => unknown) => cb?.(undefined)) as any,
    showAlert: (message: string, cb?: () => unknown) => { window.alert(message); cb?.() },
    ready: noop,
    MainButton: {
      text: 'CONTINUE',
      color: '#f97316',
      textColor: '#ffffff',
      isVisible: false,
      isActive: true,
      isProgressVisible: false,
      setText: () => undefined,
      onClick: () => undefined,
      offClick: () => undefined,
      show: () => undefined,
      hide: () => undefined,
      enable: () => undefined,
      disable: () => undefined,
      showProgress: () => undefined,
      hideProgress: () => undefined,
      setParams: () => undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    BackButton: {
      isVisible: false,
      onClick: () => undefined,
      offClick: () => undefined,
      show: () => undefined,
      hide: () => undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    HapticFeedback: {
      impactOccurred: () => undefined,
      notificationOccurred: () => undefined,
      selectionChanged: () => undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    CloudStorage: {
      setItem: (_k: string, _v: string, cb?: (err: string | null, ok?: boolean) => unknown) => cb?.(null, true),
      getItem: (k: string, cb?: (err: string | null, v?: string) => unknown) => cb?.(null, localStorage.getItem(`tg_cloud_${k}`) ?? undefined),
      getItems: (_keys: string[], cb?: (err: string | null, v?: Record<string, string>) => unknown) => cb?.(null, {}),
      removeItem: (_k: string, cb?: (err: string | null, ok?: boolean) => unknown) => cb?.(null, true),
      removeItems: (_keys: string[], cb?: (err: string | null, ok?: boolean) => unknown) => cb?.(null, true),
      getKeys: (cb?: (err: string | null, keys?: string[]) => unknown) => cb?.(null, []),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    SettingsButton: { isVisible: false, onClick: () => undefined, offClick: () => undefined, show: () => undefined, hide: () => undefined },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

const TG_SDK_URL = 'https://telegram.org/js/telegram-web-app.js'
const TG_FLAG_KEY = 'raznorab_launched_from_telegram'

/**
 * Telegram запускает мини-апп, передавая параметры в hash: #tgWebAppData=...&tgWebAppPlatform=...
 * Это позволяет понять, что мы внутри Telegram, ДО загрузки SDK — и не ходить на
 * telegram.org в обычном вебе. Флаг дублируем в sessionStorage, т.к. при навигации
 * внутри приложения hash теряется.
 */
function detectTelegramLaunch(): boolean {
  if (typeof window === 'undefined') return false
  const hash = window.location.hash
  if (hash.includes('tgWebAppData') || hash.includes('tgWebAppPlatform')) {
    try { sessionStorage.setItem(TG_FLAG_KEY, '1') } catch { /* приватный режим */ }
    return true
  }
  // SDK мог быть подключён извне (например, кастомной сборкой клиента)
  if (window.Telegram?.WebApp?.initData) return true
  try { return sessionStorage.getItem(TG_FLAG_KEY) === '1' } catch { return false }
}

export const isTelegramEnvironment = detectTelegramLaunch()

let sdkPromise: Promise<void> | null = null

function loadTelegramSdk(): Promise<void> {
  if (window.Telegram?.WebApp) return Promise.resolve()
  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise<void>((resolve) => {
    const script = document.createElement('script')
    script.src = TG_SDK_URL
    script.async = true
    script.onload = () => resolve()
    // не смогли загрузить (нет сети / домен заблокирован) — работаем как обычный веб
    script.onerror = () => resolve()
    document.head.appendChild(script)

    // страховка: не ждём SDK дольше 3 секунд, иначе приложение "залипает"
    window.setTimeout(resolve, 3000)
  })
  return sdkPromise
}

// Реальный WebApp появляется только после загрузки SDK, поэтому обращаемся лениво.
const mockWebApp = buildMockWebApp()

function currentWebApp(): WebAppType {
  return (typeof window !== 'undefined' && window.Telegram?.WebApp) || mockWebApp
}

/**
 * Готовит окружение. В обычном вебе завершается мгновенно и не делает сетевых запросов,
 * внутри Telegram — догружает SDK и инициализирует мини-апп.
 */
export async function initTelegram(): Promise<void> {
  if (!isTelegramEnvironment) return
  await loadTelegramSdk()
  try {
    const app = currentWebApp()
    app.ready()
    app.expand()
    app.setHeaderColor('#0f1117')
    app.setBackgroundColor('#0f1117')
  } catch {
    // окружение не поддерживает часть API — не критично
  }
}

export function getTelegramUser(): WebAppUser | null {
  return currentWebApp().initDataUnsafe?.user ?? null
}

export const haptic = {
  impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
    try { currentWebApp().HapticFeedback.impactOccurred(style) } catch { /* noop */ }
  },
  notification: (type: 'error' | 'success' | 'warning') => {
    try { currentWebApp().HapticFeedback.notificationOccurred(type) } catch { /* noop */ }
  },
  selection: () => {
    try { currentWebApp().HapticFeedback.selectionChanged() } catch { /* noop */ }
  },
}
