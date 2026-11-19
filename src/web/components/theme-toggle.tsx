import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { nextTheme, resolveTheme, storedTheme, THEME_KEY, type Theme } from '@/theme'

function readStored(): Theme | undefined {
  try {
    return storedTheme(window.localStorage.getItem(THEME_KEY))
  } catch {
    return undefined
  }
}

function apply(theme: Theme, remember: boolean) {
  const root = document.documentElement
  root.dataset.resolvedTheme = theme
  if (remember) {
    root.dataset.theme = theme
    try {
      window.localStorage.setItem(THEME_KEY, theme)
    } catch {
      return
    }
  }
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(() => resolveTheme(readStored(), window.matchMedia('(prefers-color-scheme: dark)').matches))
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const follow = () => {
      if (readStored() !== undefined) return
      const system = resolveTheme(undefined, media.matches)
      apply(system, false)
      setTheme(system)
    }
    media.addEventListener('change', follow)
    return () => media.removeEventListener('change', follow)
  }, [])
  const toggle = () => {
    const next = nextTheme(theme)
    apply(next, true)
    setTheme(next)
  }
  return (
    <button type="button" onClick={toggle} aria-label="Switch between light and dark" title="Switch between light and dark" className={className}>
      {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}
