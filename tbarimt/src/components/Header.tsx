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
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false)
  const [categories, setCategories] = useState<any[]>([])

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

  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery)
    }
  }, [externalSearchQuery])

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

  return (
    <>
      {/* Top Header - Logo, Search, Upload/Dipbard */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-[#004e6c]/10 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            {/* Logo */}
            <div className="flex items-center cursor-pointer group m-0 p-0" onClick={() => router.push('/')}>
              <div className="h-16 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 overflow-hidden m-0 p-0">
                <img src="/lg.png" alt="TBARIMT Logo" className="h-full w-auto object-contain" />
              </div>
            </div>

            
            {/* Search Bar */}
            <div className="flex flex-1 max-w-md mx-4 md:mx-8">
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
                  placeholder={getTranslation(language, 'search')}
                  className="block w-full pl-12 pr-4 py-3 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-[#004e6c] dark:text-gray-200 placeholder-[#004e6c]/40 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#004e6c]/30 dark:focus:ring-[#ff6b35]/30 focus:border-[#004e6c] dark:focus:border-[#ff6b35] text-sm font-medium transition-all shadow-sm hover:shadow-md"
                />
              </div>
            </div>
            
            {/* Upload and Dipbard Buttons */}
            <div className="flex items-center space-x-3">
              {/* Wishlist Icon Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/wishlist')
                }}
                className="p-2.5 rounded-xl text-[#004e6c] dark:text-gray-200 hover:bg-[#004e6c]/10 dark:hover:bg-gray-700 transition-all duration-200 relative"
                aria-label={getTranslation(language, 'wishlist') || 'Wishlist'}
                title={getTranslation(language, 'wishlist') || 'Wishlist'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              
              {/* Language Selector */}
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'mn' | 'en')}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-gray-800 text-[#004e6c] dark:text-gray-200 border-2 border-[#004e6c]/20 dark:border-gray-700 hover:border-[#004e6c]/40 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#004e6c]/30 dark:focus:ring-[#ff6b35]/30 text-sm font-semibold cursor-pointer transition-all"
                >
                  <option value="mn">🇲🇳 Мон</option>
                  <option value="en">🇬🇧 Eng</option>
                </select>
              </div>
              
              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  toggleDarkMode()
                }}
                className="p-2.5 rounded-xl text-[#004e6c] dark:text-gray-200 hover:bg-[#004e6c]/10 dark:hover:bg-gray-700 transition-all duration-200"
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
                <div className="relative">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      router.push('/account/journalist')
                    }}
                    className="bg-[#004e6c] dark:bg-[#006b8f] text-white px-5 py-2.5 rounded-xl hover:bg-[#ff6b35] dark:hover:bg-[#ff8555] transition-all duration-300 font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{getTranslation(language, 'uploadContent')}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setShowAuthModal(true)
                    }}
                    className="bg-[#004e6c] dark:bg-[#006b8f] text-white px-5 py-2.5 rounded-xl hover:bg-[#ff6b35] dark:hover:bg-[#ff8555] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {getTranslation(language, 'uploadContent')}
                  </button>
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
      </header>

      {/* Main Navigation Bar */}
      <nav className="bg-[#004e6c] dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
             
            </div>
            <div className="flex items-center space-x-8">
              <div 
                className="relative"
                onMouseEnter={() => setShowCategoriesDropdown(true)}
                onMouseLeave={() => setShowCategoriesDropdown(false)}
              >
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    router.push('/products')
                  }}
                  className="text-white/90 hover:text-white transition-colors font-semibold text-sm relative group"
                >
                  {getTranslation(language, 'categories')}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
                </button>
                
                {/* Categories Dropdown - Wide 3-column layout */}
                {showCategoriesDropdown && categories.length > 0 && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-[900px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-6 z-50">
                    <div className="px-6 pb-4 border-b border-gray-200 dark:border-gray-700 mb-4">
                      <h3 className="text-lg font-bold text-[#004e6c] dark:text-white">
                        {getTranslation(language, 'categories')}
                      </h3>
                    </div>
                    <div className="px-6">
                      <div className="grid grid-cols-3 gap-6">
                        {categories.map((category: any) => (
                          <div key={category.id} className="flex flex-col">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                router.push(`/category/${category.id}`)
                                setShowCategoriesDropdown(false)
                              }}
                              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#004e6c]/10 dark:hover:bg-gray-700 transition-colors group mb-2"
                            >
                              <span className="text-sm font-bold text-[#004e6c] dark:text-white group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
                                {category.name}
                              </span>
                            </button>
                            {category.subcategories && category.subcategories.length > 0 && (
                              <div className="space-y-1">
                                {category.subcategories.map((subcategory: any) => (
                                  <button
                                    key={subcategory.id}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      router.push(`/category/${subcategory.id}`)
                                      setShowCategoriesDropdown(false)
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-md hover:bg-[#004e6c]/5 dark:hover:bg-gray-700/50 transition-colors text-xs text-gray-700 dark:text-gray-300 hover:text-[#004e6c] dark:hover:text-white font-medium"
                                  >
                                    {subcategory.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/howitworks')
                }}
                className="text-white/90 hover:text-white transition-colors font-semibold text-sm relative group"
              >
                {getTranslation(language, 'howItWorks')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/membership')
                }}
                className="text-white/90 hover:text-white transition-colors font-semibold text-sm relative group"
              >
                {getTranslation(language, 'pricing')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/faq')
                }}
                className="text-white/90 hover:text-white transition-colors font-semibold text-sm relative group"
              >
                {getTranslation(language, 'faq')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

