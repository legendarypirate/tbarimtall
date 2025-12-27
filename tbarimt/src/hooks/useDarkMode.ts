'use client'

import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // On mount, check the actual DOM state first (set by script in layout.tsx)
    // then sync with localStorage
    const hasDarkClass = document.documentElement.classList.contains('dark')
    const stored = localStorage.getItem('darkMode')
    
    // Determine initial state - prioritize DOM state (set by script) over localStorage
    let initialDark = false
    if (hasDarkClass) {
      initialDark = true
    } else if (stored !== null) {
      initialDark = stored === 'true'
    } else {
      initialDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    
    // Set state - the second useEffect will handle DOM and localStorage updates
    setIsDark(initialDark)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    // Update HTML class and localStorage whenever isDark changes
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('darkMode', 'false')
    }
  }, [isDark, mounted])

  const toggle = () => {
    setIsDark(prev => !prev)
  }

  return { isDark, toggle, mounted }
}

