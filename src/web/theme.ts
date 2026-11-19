export type Theme = 'light' | 'dark'

export const THEME_KEY = 'theme'

export function storedTheme(value: string | null): Theme | undefined {
  return value === 'light' || value === 'dark' ? value : undefined
}

export function resolveTheme(stored: Theme | undefined, prefersDark: boolean): Theme {
  return stored ?? (prefersDark ? 'dark' : 'light')
}

export function nextTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark'
}
