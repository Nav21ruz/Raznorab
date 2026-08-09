import { createContext } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'
export type EffectiveTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'briggo-theme'

export interface ThemeContextValue {
  theme: ThemeChoice
  effectiveTheme: EffectiveTheme
  setTheme: (theme: ThemeChoice) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function readStoredTheme(): ThemeChoice {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

export function systemPrefersLight() {
  return window.matchMedia('(prefers-color-scheme: light)').matches
}
