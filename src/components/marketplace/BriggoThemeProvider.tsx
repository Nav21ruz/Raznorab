import { useEffect, useState, type ReactNode } from 'react'
import {
  ThemeContext,
  readStoredTheme,
  systemPrefersLight,
  THEME_STORAGE_KEY,
  type ThemeChoice,
  type EffectiveTheme,
} from '../../lib/briggoTheme'

// Тёмная — исходная тема сайта (и единственная тема «Журнала объекта», у которого нет
// этого провайдера вообще), поэтому "как в системе" трактуем так: светлая ОС — светлая
// тема, тёмная или неизвестная ОС — прежняя тёмная, а не наоборот.
export function BriggoThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>(() => readStoredTheme())
  const [prefersLight, setPrefersLight] = useState(() => systemPrefersLight())

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => setPrefersLight(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const effectiveTheme: EffectiveTheme = theme === 'system' ? (prefersLight ? 'light' : 'dark') : theme

  const setTheme = (next: ThemeChoice) => {
    setThemeState(next)
    if (next === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, next)
  }

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      <div data-theme={effectiveTheme === 'light' ? 'light' : undefined}>{children}</div>
    </ThemeContext.Provider>
  )
}
