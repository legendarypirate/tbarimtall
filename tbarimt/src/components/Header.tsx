'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useLanguage } from '@/contexts/LanguageContext'
import { getTranslation } from '@/lib/translations'
import { getCategories } from '@/lib/api'
import AuthModal from './AuthModal'

interface HeaderProps {
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export default function Header({ searchQuery: externalSearchQuery, onSearchChange }: HeaderProps) {
  const router = useRouter()
  const { isDark, toggle: toggleDarkMode } = useDarkMode()
  const { language, setLanguage } = useLanguage()
  const [isJournalist, setIsJournalist] = useState(false)
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showCategoriesDrawer, setShowCategoriesDrawer] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [weather, setWeather] = useState<{ temp: number; description: string; icon: string } | null>(null)
  
  // Map WMO weather codes to descriptions and icons
  const getWeatherInfo = (code: number, isDay: number): { description: string; icon: string } => {
    const isDayTime = isDay === 1
    // WMO Weather Code mapping
    const weatherMap: { [key: number]: { description: string; icon: string } } = {
      0: { description: 'Тод тэнгэр', icon: isDayTime ? '☀️' : '🌙' },
      1: { description: 'Голчлон тод', icon: isDayTime ? '🌤️' : '☁️' },
      2: { description: 'Хэсэгчлэн үүлтэй', icon: isDayTime ? '⛅' : '☁️' },
      3: { description: 'Үүлтэй', icon: '☁️' },
      45: { description: 'Манан', icon: '🌫️' },
      48: { description: 'Хөлдсөн манан', icon: '🌫️' },
      51: { description: 'Бага зэргийн бороо', icon: '🌦️' },
      53: { description: 'Дунд зэргийн бороо', icon: '🌦️' },
      55: { description: 'Хүчтэй бороо', icon: '🌧️' },
      56: { description: 'Хөлдсөн бага бороо', icon: '🌨️' },
      57: { description: 'Хөлдсөн хүчтэй бороо', icon: '🌨️' },
      61: { description: 'Бага бороо', icon: '🌦️' },
      63: { description: 'Дунд бороо', icon: '🌧️' },
      65: { description: 'Хүчтэй бороо', icon: '🌧️' },
      66: { description: 'Хөлдсөн бага бороо', icon: '🌨️' },
      67: { description: 'Хөлдсөн хүчтэй бороо', icon: '🌨️' },
      71: { description: 'Бага цас', icon: '🌨️' },
      73: { description: 'Дунд цас', icon: '❄️' },
      75: { description: 'Хүчтэй цас', icon: '❄️' },
      77: { description: 'Цасны ширхэг', icon: '❄️' },
      80: { description: 'Бага борооны шүүрэл', icon: '🌦️' },
      81: { description: 'Дунд борооны шүүрэл', icon: '🌧️' },
      82: { description: 'Хүчтэй борооны шүүрэл', icon: '⛈️' },
      85: { description: 'Бага цасны шүүрэл', icon: '🌨️' },
      86: { description: 'Хүчтэй цасны шүүрэл', icon: '❄️' },
      95: { description: 'Аянгатай бороо', icon: '⛈️' },
      96: { description: 'Аянгатай мөндөртэй бороо', icon: '⛈️' },
      99: { description: 'Хүчтэй аянгатай мөндөр', icon: '⛈️' },
    }
    
    return weatherMap[code] || { description: 'Тодорхойгүй', icon: '🌤️' }
  }
  const [currency, setCurrency] = useState<{ usd: number; eur: number } | null>(null)
  const [loadingWeather, setLoadingWeather] = useState(false)
  const [loadingCurrency, setLoadingCurrency] = useState(false)

  useEffect(() => {
    // Check if user is logged in as journalist
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setIsJournalist(user.role === 'journalist')
      } catch (e) {
        setIsJournalist(false)
      }
    }
  }, [])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories()
        if (response.categories && Array.isArray(response.categories)) {
          // Filter to only show parent categories (those with subcategories)
          const filteredCategories = response.categories.filter((cat: any) => {
            // Skip categories with generic names like "Category 37", "Category 40", etc.
            const isGenericCategory = /^Category\s+\d+$/i.test(cat.name)
            if (isGenericCategory) {
              return false
            }
            // Only show categories that have subcategories (parent categories)
            const hasSubcategories = cat.subcategories && Array.isArray(cat.subcategories) && cat.subcategories.length > 0
            return hasSubcategories
          })
          setCategories(filteredCategories)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchCategories()
  }, [])

  // Fetch weather data using Open-Meteo API
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoadingWeather(true)
        // Using Open-Meteo API for Ulaanbaatar, Mongolia
        // Coordinates: lat=47.92, lon=106.92
        const lat = 47.92
        const lon = 106.92
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        
        const response = await fetch(url)
        
        if (response.ok) {
          const data = await response.json()
          if (data.current_weather) {
            const { temperature, weathercode, is_day } = data.current_weather
            const weatherInfo = getWeatherInfo(weathercode, is_day)
            
            setWeather({
              temp: Math.round(temperature),
              description: weatherInfo.description,
              icon: weatherInfo.icon
            })
          } else {
            setWeather(null)
          }
        } else {
          // Handle non-ok responses
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
          console.error('Weather API error:', response.status, errorData)
          setWeather(null)
        }
      } catch (error) {
        console.error('Error fetching weather:', error)
        setWeather(null)
      } finally {
        setLoadingWeather(false)
      }
    }

    fetchWeather()
    // Refresh weather every 30 minutes
    const weatherInterval = setInterval(fetchWeather, 30 * 60 * 1000)
    return () => clearInterval(weatherInterval)
  }, [])

  // Fetch currency exchange rates (Mongolian Bank rates)
  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        setLoadingCurrency(true)
        // Using exchangerate-api.com - fetching USD as base to get MNT rate
        // For production, consider using Bank of Mongolia's official API
        const url = 'https://api.exchangerate-api.com/v4/latest/USD'
        
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          // Get USD to MNT rate (1 USD = X MNT)
          const usdToMnt = data.rates?.MNT || 3400
          // Get EUR rate first, then calculate EUR to MNT
          const eurRate = data.rates?.EUR || 0.92
          const eurToMnt = Math.round(usdToMnt / eurRate)
          
          setCurrency({
            usd: Math.round(usdToMnt),
            eur: eurToMnt
          })
        } else {
          // Fallback rates (approximate Mongolian bank rates)
          setCurrency({
            usd: 3400,
            eur: 3700
          })
        }
      } catch (error) {
        console.error('Error fetching currency:', error)
        // Set fallback currency data (approximate rates)
        setCurrency({
          usd: 3400,
          eur: 3700
        })
      } finally {
        setLoadingCurrency(false)
      }
    }

    fetchCurrency()
    // Refresh currency every 5 minutes
    const currencyInterval = setInterval(fetchCurrency, 5 * 60 * 1000)
    return () => clearInterval(currencyInterval)
  }, [])

  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery)
    }
  }, [externalSearchQuery])

  // Close drawer on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCategoriesDrawer) {
          setShowCategoriesDrawer(false)
        }
        if (showMobileMenu) {
          setShowMobileMenu(false)
        }
      }
    }
    
    if (showCategoriesDrawer || showMobileMenu) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when drawer/menu is open
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showCategoriesDrawer, showMobileMenu])

  // Close mobile menu when route changes
  useEffect(() => {
    const handleRouteChange = () => {
      setShowMobileMenu(false)
    }
    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])


  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (onSearchChange) {
      onSearchChange(value)
    }
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  // Check if user is authenticated
  const isAuthenticated = () => {
    if (typeof window === 'undefined') return false
    const token = localStorage.getItem('token')
    return !!token
  }

  // Handle wishlist button click
  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowAuthModal(true)
  }

  return (
    <>
      {/* Top Header - Logo, Search, Upload/Dipbard */}
      <header className="sticky top-0 z-50 bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-soft relative overflow-hidden">
        <div className="w-full px-3 sm:px-4 lg:container lg:mx-auto relative z-10">
          {/* Mobile Layout */}
          <div className="flex lg:hidden items-center justify-between py-3">
            {/* Logo */}
            <div className="flex items-center cursor-pointer group" onClick={() => router.push('/')}>
              <div className="h-8 sm:h-[2.4rem] rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 overflow-hidden">
                <img src="/lg.png" alt="TBARIMT Logo" className="h-full w-auto object-contain" />
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleWishlistClick}
                className="p-2 rounded-xl text-[#004e6c] dark:text-gray-200 hover:bg-[#004e6c]/10 dark:hover:bg-gray-700 transition-all duration-200 relative overflow-hidden"
                aria-label={getTranslation(language, 'wishlist') || 'Wishlist'}
              >
                {/* Animated silver vertical line */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-silver animate-silver-line z-10"
                  style={{
                    backgroundColor: '#c0c0c0',
                    boxShadow: '0 0 4px rgba(192, 192, 192, 0.8)',
                  }}
                />
                <svg className="w-5 h-5 relative z-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-xl text-[#004e6c] dark:text-gray-200 hover:bg-[#004e6c]/10 dark:hover:bg-gray-700 transition-all duration-200"
                aria-label="Menu"
              >
                {showMobileMenu ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex justify-between items-center py-5">
            {/* Logo */}
            <div className="flex items-center cursor-pointer group" onClick={() => router.push('/')}>
              <div className="h-[3.2rem] rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 overflow-hidden">
                <img src="/lg.png" alt="TBARIMT Logo" className="h-full w-auto object-contain" />
              </div>
            </div>

            {/* Search Bar - grows to use available space */}
            <div className="flex flex-1 min-w-0 max-w-2xl mx-4 md:mx-6 lg:mx-8">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-[#004e6c]/60 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder={getTranslation(language, 'search') || 'Хэрэгтэй контентоо хайх'}
                  className="block w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:focus:ring-primary-400/30 focus:border-primary-500 dark:focus:border-primary-400 text-sm font-medium transition-all shadow-sm hover:shadow-md"
                />
              </div>
            </div>
            
            {/* Upload and Dipbard Buttons */}
            <div className="flex items-center space-x-3">
              {/* Wishlist Icon Button */}
              <button
                type="button"
                onClick={handleWishlistClick}
                className="p-2.5 rounded-xl text-[#004e6c] dark:text-gray-200 hover:bg-[#004e6c]/10 dark:hover:bg-gray-700 transition-all duration-200 relative overflow-hidden"
                aria-label={getTranslation(language, 'wishlist') || 'Wishlist'}
                title={getTranslation(language, 'wishlist') || 'Wishlist'}
              >
                {/* Animated silver vertical line */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-silver animate-silver-line z-10"
                  style={{
                    backgroundColor: '#c0c0c0',
                    boxShadow: '0 0 4px rgba(192, 192, 192, 0.8)',
                  }}
                />
                <svg className="w-5 h-5 relative z-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              
              {/* Language Selector */}
              <div className="relative flex items-center gap-2">
                <img
                  src={`https://flagcdn.com/w40/${language === 'mn' ? 'mn' : 'gb'}.png`}
                  alt=""
                  className="w-6 h-4 rounded object-cover shrink-0"
                  width={24}
                  height={16}
                />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'mn' | 'en')}
                  className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:focus:ring-primary-400/30 text-sm font-semibold cursor-pointer transition-all"
                >
                  <option value="mn">Мон</option>
                  <option value="en">Eng</option>
                </select>
              </div>
              
              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  toggleDarkMode()
                }}
                className="p-2.5 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                aria-label="Toggle dark mode"
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              
              {isJournalist ? (
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#004e6c] via-[#ff6b35] to-[#004e6c] rounded-xl opacity-75 group-hover:opacity-100 blur-sm transition-all duration-500 animate-pulse"></div>
                  {/* Floating stars around button */}
                  <div className="absolute -top-2 -left-2 animate-star-float">
                    <svg className="w-2 h-2 animate-star-pulse text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l2.4 4.85L20 8.5l-3.9 3.8.9 5.3L12 16.5l-5 2.1.9-5.3L4 8.5l5.6-1.65L12 2z" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-2 -right-2 animate-star-float" style={{ animationDelay: '0.5s' }}>
                    <svg className="w-2 h-2 animate-star-pulse text-yellow-200" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l2.4 4.85L20 8.5l-3.9 3.8.9 5.3L12 16.5l-5 2.1.9-5.3L4 8.5l5.6-1.65L12 2z" />
                    </svg>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      router.push('/account/journalist')
                    }}
                    className="relative bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-500 dark:to-primary-600 text-white px-6 py-3 rounded-full hover:from-primary-700 hover:to-primary-600 dark:hover:from-primary-600 dark:hover:to-primary-700 transition-all duration-300 font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95 overflow-visible"
                  >
                    {/* Animated star icon */}
                    <svg className="w-5 h-5 animate-star-rotate text-yellow-300 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span className="relative z-10">{getTranslation(language, 'uploadContent')}</span>
                    {/* Floating star decoration */}
                    <div className="absolute -top-1 -right-1">
                      <svg className="w-3 h-3 animate-star-twinkle text-yellow-200" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l2.4 4.85L20 8.5l-3.9 3.8.9 5.3L12 16.5l-5 2.1.9-5.3L4 8.5l5.6-1.65L12 2z" />
                      </svg>
                    </div>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#004e6c] via-[#ff6b35] to-[#004e6c] rounded-xl opacity-60 group-hover:opacity-100 blur-sm transition-all duration-500 animate-pulse"></div>
                    {/* Floating stars around button */}
                    <div className="absolute -top-2 -left-2 animate-star-float">
                      <svg className="w-2 h-2 animate-star-pulse text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l2.4 4.85L20 8.5l-3.9 3.8.9 5.3L12 16.5l-5 2.1.9-5.3L4 8.5l5.6-1.65L12 2z" />
                      </svg>
                    </div>
                    <div className="absolute -bottom-2 -right-2 animate-star-float" style={{ animationDelay: '0.5s' }}>
                      <svg className="w-2 h-2 animate-star-pulse text-yellow-200" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l2.4 4.85L20 8.5l-3.9 3.8.9 5.3L12 16.5l-5 2.1.9-5.3L4 8.5l5.6-1.65L12 2z" />
                      </svg>
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        setShowAuthModal(true)
                      }}
                      className="relative bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-500 dark:to-primary-600 text-white px-6 py-3 rounded-full hover:from-primary-700 hover:to-primary-600 dark:hover:from-primary-600 dark:hover:to-primary-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95 flex items-center space-x-2 overflow-visible"
                    >
                      {/* Animated star icon */}
                      <svg className="w-5 h-5 animate-star-rotate text-yellow-300 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span className="relative z-10">{getTranslation(language, 'uploadContent')}</span>
                      {/* Floating star decoration */}
                      <div className="absolute -top-1 -right-1">
                        <svg className="w-3 h-3 animate-star-twinkle text-yellow-200" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l2.4 4.85L20 8.5l-3.9 3.8.9 5.3L12 16.5l-5 2.1.9-5.3L4 8.5l5.6-1.65L12 2z" />
                        </svg>
                      </div>
                      <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                  <AuthModal
                    isOpen={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                    onSelectGoogle={() => setShowAuthModal(false)}
                    onSelectFacebook={() => setShowAuthModal(false)}
                  />
                </>
              )}
             
            </div>
          </div>
        </div>

        {/* Mobile Menu Backdrop */}
        {showMobileMenu && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 dark:bg-black/70 z-40 top-[73px]"
            onClick={() => setShowMobileMenu(false)}
          />
        )}

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-[#004e6c]/10 dark:border-gray-700/50 bg-white dark:bg-gray-900 relative z-50">
            <div className="w-full px-3 py-4 lg:container lg:mx-auto space-y-3">
              {/* Mobile Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-[#004e6c]/60 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder={getTranslation(language, 'search')}
                  className="block w-full pl-10 pr-4 py-2.5 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-[#004e6c] dark:text-gray-200 placeholder-[#004e6c]/40 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#004e6c]/30 dark:focus:ring-[#ff6b35]/30 text-sm"
                />
              </div>

              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setShowCategoriesDrawer(true)
                    setShowMobileMenu(false)
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#004e6c]/10 dark:bg-gray-700/30 text-[#004e6c] dark:text-white font-semibold text-sm"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>{getTranslation(language, 'categories')}</span>
                  </div>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    router.push('/howitworks')
                    setShowMobileMenu(false)
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-3 rounded-xl bg-[#004e6c]/10 dark:bg-gray-700/30 text-[#004e6c] dark:text-white font-semibold text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>{getTranslation(language, 'howItWorks')}</span>
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    router.push('/membership')
                    setShowMobileMenu(false)
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-3 rounded-xl bg-[#004e6c]/10 dark:bg-gray-700/30 text-[#004e6c] dark:text-white font-semibold text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{getTranslation(language, 'pricing')}</span>
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    router.push('/products')
                    setShowMobileMenu(false)
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-3 rounded-xl bg-[#004e6c]/10 dark:bg-gray-700/30 text-[#004e6c] dark:text-white font-semibold text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>{getTranslation(language, 'faq')}</span>
                </button>
              </div>

              {/* Mobile Settings */}
              <div className="flex items-center justify-between pt-3 border-t border-[#004e6c]/10 dark:border-gray-700/50">
                <div className="flex items-center space-x-2">
                  <img
                    src={`https://flagcdn.com/w40/${language === 'mn' ? 'mn' : 'gb'}.png`}
                    alt=""
                    className="w-6 h-4 rounded object-cover shrink-0"
                    width={24}
                    height={16}
                  />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'mn' | 'en')}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-gray-800 text-[#004e6c] dark:text-gray-200 border-2 border-[#004e6c]/20 dark:border-gray-700 text-sm font-semibold"
                  >
                    <option value="mn">Мон</option>
                    <option value="en">Eng</option>
                  </select>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      toggleDarkMode()
                    }}
                    className="p-2.5 rounded-xl text-[#004e6c] dark:text-gray-200 hover:bg-[#004e6c]/10 dark:hover:bg-gray-700 transition-all"
                  >
                    {isDark ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                  </button>
                </div>
                {isJournalist ? (
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#004e6c] via-[#ff6b35] to-[#004e6c] rounded-xl opacity-75 group-hover:opacity-100 blur-sm transition-all duration-500 animate-pulse"></div>
                    {/* Floating stars around button */}
                    <div className="absolute -top-2 -left-2 animate-star-float">
                      <svg className="w-2 h-2 animate-star-pulse text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l2.4 4.85L20 8.5l-3.9 3.8.9 5.3L12 16.5l-5 2.1.9-5.3L4 8.5l5.6-1.65L12 2z" />
                      </svg>
                    </div>
                    <div className="absolute -bottom-2 -right-2 animate-star-float" style={{ animationDelay: '0.5s' }}>
                      <svg className="w-2 h-2 animate-star-pulse text-yellow-200" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l2.4 4.85L20 8.5l-3.9 3.8.9 5.3L12 16.5l-5 2.1.9-5.3L4 8.5l5.6-1.65L12 2z" />
                      </svg>
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        router.push('/account/journalist')
                        setShowMobileMenu(false)
                      }}
                      className="relative bg-gradient-to-r from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#0080a8] text-white px-4 py-2 rounded-xl hover:from-[#ff6b35] hover:to-[#ff8555] dark:hover:from-[#ff8555] dark:hover:to-[#ff9f75] transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center space-x-2 overflow-visible"
                    >
                      {/* Animated star icon */}
                      <svg className="w-4 h-4 animate-star-rotate text-yellow-300 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span className="relative z-10">{getTranslation(language, 'uploadContent')}</span>
                      {/* Floating star decoration */}
                      <div className="absolute -top-1 -right-1">
                        <svg className="w-2.5 h-2.5 animate-star-twinkle text-yellow-200" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l2.4 4.85L20 8.5l-3.9 3.8.9 5.3L12 16.5l-5 2.1.9-5.3L4 8.5l5.6-1.65L12 2z" />
                        </svg>
                      </div>
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#004e6c] via-[#ff6b35] to-[#004e6c] rounded-xl opacity-60 group-hover:opacity-100 blur-sm transition-all duration-500 animate-pulse"></div>
                      {/* Floating stars around button */}
                      <div className="absolute -top-2 -left-2 animate-star-float">
                        <svg className="w-2 h-2 animate-star-pulse text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l2.4 4.85L20 8.5l-3.9 3.8.9 5.3L12 16.5l-5 2.1.9-5.3L4 8.5l5.6-1.65L12 2z" />
                        </svg>
                      </div>
                      <div className="absolute -bottom-2 -right-2 animate-star-float" style={{ animationDelay: '0.5s' }}>
                        <svg className="w-2 h-2 animate-star-pulse text-yellow-200" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l2.4 4.85L20 8.5l-3.9 3.8.9 5.3L12 16.5l-5 2.1.9-5.3L4 8.5l5.6-1.65L12 2z" />
                        </svg>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setShowAuthModal(true)
                          setShowMobileMenu(false)
                        }}
                        className="relative bg-gradient-to-r from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#0080a8] text-white px-4 py-2 rounded-xl hover:from-[#ff6b35] hover:to-[#ff8555] dark:hover:from-[#ff8555] dark:hover:to-[#ff9f75] transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center space-x-2 overflow-visible"
                      >
                        {/* Animated star icon */}
                        <svg className="w-4 h-4 animate-star-rotate text-yellow-300 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="relative z-10">{getTranslation(language, 'uploadContent')}</span>
                        {/* Floating star decoration */}
                        <div className="absolute -top-1 -right-1">
                          <svg className="w-2.5 h-2.5 animate-star-twinkle text-yellow-200" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l2.4 4.85L20 8.5l-3.9 3.8.9 5.3L12 16.5l-5 2.1.9-5.3L4 8.5l5.6-1.65L12 2z" />
                          </svg>
                        </div>
                        <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </div>
                    <AuthModal
                      isOpen={showAuthModal}
                      onClose={() => setShowAuthModal(false)}
                      onSelectGoogle={() => setShowAuthModal(false)}
                      onSelectFacebook={() => setShowAuthModal(false)}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Navigation Bar */}
      <nav className="bg-[#004e6c] dark:bg-gray-800 shadow-lg">
        <div className="w-full px-3 sm:px-4 lg:container lg:mx-auto">
          <div className="flex flex-row items-center justify-between py-2 lg:py-2.5 gap-2 min-h-0">
            {/* Weather and Currency - single row */}
            <div className="flex items-center flex-wrap gap-2 sm:gap-3 overflow-x-auto shrink-0">
              {/* Weather - one line */}
              {weather && (
                <div className="flex items-center gap-1.5 bg-white/10 dark:bg-gray-700/30 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20 dark:border-gray-600/30 flex-shrink-0">
                  {loadingWeather ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="text-sm">{weather.icon}</span>
                      <span className="text-xs font-bold text-white">{weather.temp}°C</span>
                      <span className="text-[10px] text-white/80 capitalize hidden sm:inline">{weather.description}</span>
                    </>
                  )}
                </div>
              )}
              {/* Currency - one line: USD and EUR inline */}
              {currency && (
                <div className="flex items-center gap-2 bg-white/10 dark:bg-gray-700/30 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20 dark:border-gray-600/30 flex-shrink-0">
                  {loadingCurrency ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <img src="https://flagcdn.com/w40/us.png" alt="" className="w-4 h-3 rounded-sm object-cover shrink-0" width={16} height={12} title="USD" />
                      <span className="text-[10px] text-white/70 uppercase font-medium">USD</span>
                      <span className="text-xs font-bold text-white">{currency.usd.toLocaleString('mn-MN')}</span>
                      <span className="w-px h-3 bg-white/30" />
                      <img src="https://flagcdn.com/w40/eu.png" alt="" className="w-4 h-3 rounded-sm object-cover shrink-0" width={16} height={12} title="EUR" />
                      <span className="text-[10px] text-white/70 uppercase font-medium">EUR</span>
                      <span className="text-xs font-bold text-white">{currency.eur.toLocaleString('mn-MN')}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Links - Right Side - Hidden on Mobile */}
            <div className="hidden lg:flex items-center space-x-2 relative z-10 pointer-events-auto">
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setShowCategoriesDrawer(true)
                }}
                className="relative z-10 inline-flex items-center gap-2 text-white/90 hover:text-white transition-all font-semibold text-sm group px-4 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-gray-700/30 min-h-[36px] cursor-pointer select-none touch-manipulation pointer-events-auto active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#004e6c]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>{getTranslation(language, 'categories')}</span>
                <span className="pointer-events-none absolute bottom-1 left-3 right-3 w-0 h-0.5 bg-white/90 group-hover:w-[calc(100%-1.5rem)] transition-all duration-300"></span>
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/howitworks')
                }}
                className="relative z-10 inline-flex items-center gap-2 text-white/90 hover:text-white transition-all font-semibold text-sm group px-4 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-gray-700/30 min-h-[36px] cursor-pointer select-none touch-manipulation pointer-events-auto active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#004e6c]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{getTranslation(language, 'howItWorks')}</span>
                <span className="pointer-events-none absolute bottom-1 left-3 right-3 w-0 h-0.5 bg-white/90 group-hover:w-[calc(100%-1.5rem)] transition-all duration-300"></span>
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/membership')
                }}
                className="relative z-10 inline-flex items-center gap-2 text-white/90 hover:text-white transition-all font-semibold text-sm group px-4 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-gray-700/30 min-h-[36px] cursor-pointer select-none touch-manipulation pointer-events-auto active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#004e6c]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{getTranslation(language, 'pricing')}</span>
                <span className="pointer-events-none absolute bottom-1 left-3 right-3 w-0 h-0.5 bg-white/90 group-hover:w-[calc(100%-1.5rem)] transition-all duration-300"></span>
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/products')
                }}
                className="relative z-10 inline-flex items-center gap-2 text-white/90 hover:text-white transition-all font-semibold text-sm group px-4 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-gray-700/30 min-h-[36px] cursor-pointer select-none touch-manipulation pointer-events-auto active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#004e6c]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>{getTranslation(language, 'faq')}</span>
                <span className="pointer-events-none absolute bottom-1 left-3 right-3 w-0 h-0.5 bg-white/90 group-hover:w-[calc(100%-1.5rem)] transition-all duration-300"></span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Categories Drawer - Slides in from right */}
      {showCategoriesDrawer && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 transition-opacity"
            onClick={() => setShowCategoriesDrawer(false)}
          />
          
          {/* Drawer */}
          <div className={`fixed top-0 right-0 h-full w-full max-w-4xl bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-hidden flex flex-col ${
            showCategoriesDrawer ? 'translate-x-0' : 'translate-x-full'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-[#004e6c] dark:bg-gray-900">
              <h2 className="text-2xl font-bold text-white">
                {getTranslation(language, 'categories')}
              </h2>
              <button
                onClick={() => setShowCategoriesDrawer(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {categories.length > 0 ? (
                <div className="p-6">
                  <div className="grid grid-cols-4 gap-6">
                    {categories.map((category: any) => {
                      // Limit subcategories to 10
                      const displaySubcategories = category.subcategories && Array.isArray(category.subcategories) 
                        ? category.subcategories.slice(0, 10)
                        : [];
                      const hasMoreSubcategories = category.subcategories && category.subcategories.length > 10;
                      
                      return (
                        <div key={category.id} className="flex flex-col">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              router.push(`/category/${category.id}`)
                              setShowCategoriesDrawer(false)
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#004e6c]/10 dark:hover:bg-gray-700 transition-all duration-200 group mb-3 border-l-4 border-transparent hover:border-[#004e6c] dark:hover:border-[#ff6b35]"
                          >
                            <span className="text-base font-bold text-[#004e6c] dark:text-white group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors flex items-center">
                              {category.name}
                              <svg className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </button>
                          {displaySubcategories.length > 0 && (
                            <div className="space-y-1.5 pl-4">
                              {displaySubcategories.map((subcategory: any) => (
                                <button
                                  key={subcategory.id}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    router.push(`/subcategory/${subcategory.id}`)
                                    setShowCategoriesDrawer(false)
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-md hover:bg-[#004e6c]/8 dark:hover:bg-gray-700/60 transition-all duration-150 text-sm text-gray-700 dark:text-gray-300 hover:text-[#004e6c] dark:hover:text-white font-medium hover:translate-x-1 transform group"
                                >
                                  <span className="flex items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#004e6c]/30 dark:bg-gray-500 mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                    {subcategory.name}
                                  </span>
                                </button>
                              ))}
                              {hasMoreSubcategories && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    router.push(`/category/${category.id}`)
                                    setShowCategoriesDrawer(false)
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-md hover:bg-[#004e6c]/8 dark:hover:bg-gray-700/60 transition-all duration-150 text-xs text-[#004e6c] dark:text-[#ff6b35] font-semibold italic mt-2"
                                >
                                  + {category.subcategories.length - 10} {language === 'mn' ? 'бусад' : 'more'}...
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">
                    {language === 'mn' ? 'Ангилал олдсонгүй' : 'No categories found'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/products')
                  setShowCategoriesDrawer(false)
                }}
                className="w-full text-center px-4 py-3 rounded-lg bg-[#004e6c] dark:bg-[#006b8f] hover:bg-[#ff6b35] dark:hover:bg-[#ff8555] text-white transition-all duration-200 font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {language === 'mn' ? 'Бүх ангилал харах' : 'View All Categories'} →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Auth Modal - Always available for wishlist and other auth needs */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSelectGoogle={() => setShowAuthModal(false)}
        onSelectFacebook={() => setShowAuthModal(false)}
      />
    </>
  )
}

