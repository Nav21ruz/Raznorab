import { useContext } from 'react'
import { ThemeContext } from '../lib/briggoTheme'

export function useBriggoTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useBriggoTheme должен использоваться внутри BriggoThemeProvider')
  return ctx
}
