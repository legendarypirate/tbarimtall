'use client'

import { useEffect } from 'react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize dark mode from localStorage before React hydrates
    const stored = localStorage.getItem('darkMode')
    if (stored === 'true') {
      document.documentElement.classList.add('dark')
    } else if (stored === 'false') {
      document.documentElement.classList.remove('dark')
    } else if (stored === null) {
      // If no preference stored, check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [])

  return <>{children}</>
}

