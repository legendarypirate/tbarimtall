'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language } from '@/lib/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('mn')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load language from localStorage
    const stored = localStorage.getItem('language') as Language
    if (stored === 'en' || stored === 'mn') {
      setLanguageState(stored)
    } else {
      // Default to Mongolian
      setLanguageState('mn')
      localStorage.setItem('language', 'mn')
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

