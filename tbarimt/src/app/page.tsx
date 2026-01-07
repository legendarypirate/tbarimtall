'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDarkMode } from '@/hooks/useDarkMode'
import { getCategories, getFeaturedProducts, getTopJournalists } from '@/lib/api'

// Default categories data (fallback)
const defaultCategories = [
  {
    id: 1,
    name: 'ХИЧЭЭЛ, СУРЛАГА',
    icon: '📚',
    subcategories: [
      { id: 52, name: 'ТӨСӨЛ ТАТАХ (бүх төрлийн)', url: '/page/52' },
      { id: 53, name: 'ДАДЛАГЫН ТАЙЛАНГУУД', url: '/page/53' },
      { id: 46, name: 'Курсын ажил', url: '/page/46' },
      { id: 47, name: 'Дипломын ажил', url: '/page/47' },
      { id: 61, name: 'Бие даалт', url: '/page/61' },
      { id: 57, name: 'Хичээл', url: '/page/57' },
      { id: 114, name: 'Солонгос хэл', url: '/page/114' },
      { id: 127, name: 'Эсээ, Кейс бичлэг', url: '/page/127' },
      { id: 51, name: 'Танин мэдэхүй', url: '/page/51' },
      { id: 55, name: 'Компьютер', url: '/page/55' },
      { id: 65, name: 'ЕРӨНХИЙ МАТЕМАТИК', url: '/page/65' }
    ]
  },
  {
    id: 2,
    name: 'ТӨСӨЛ, БЭЛЭН ЗАГВАР',
    icon: '📋',
    subcategories: [
      { id: 64, name: 'Хэрэгжиж буй сайн төслүүд', url: '/page/64' }
    ]
  },
  {
    id: 3,
    name: 'ГРАФИК, ДИЗАЙН',
    icon: '🎨',
    subcategories: [
      { id: 42, name: 'Photoshop -н бэлэн загвар', url: '/page/42' },
      { id: 43, name: 'Vector', url: '/page/43' },
      { id: 58, name: 'AutoCAD, 3D Max', url: '/page/58' }
    ]
  },
  {
    id: 4,
    name: 'ПРОГРАМ ХАНГАМЖ',
    icon: '💻',
    subcategories: [
      { id: 40, name: 'Зөөврийн програм', url: '/page/40' },
      { id: 41, name: 'Програм', url: '/page/41' }
    ]
  },
  {
    id: 5,
    name: 'ТОГЛООМ',
    icon: '🎮',
    subcategories: [
      { id: 49, name: 'Уралдаан', url: '/page/49' },
      { id: 50, name: 'Тулаан', url: '/page/50' },
      { id: 37, name: 'IQ', url: '/page/37' },
      { id: 36, name: 'Hidden Object', url: '/page/36' }
    ]
  },
  {
    id: 6,
    name: 'ДУУ ХӨГЖИМ',
    icon: '🎵',
    subcategories: [
      { id: 56, name: 'Дуу, Хөгжим', url: '/page/56' }
    ]
  },
  {
    id: 7,
    name: 'БАРИМТ БИЧИГ',
    icon: '📄',
    subcategories: [
      { id: 44, name: 'Гэрээ', url: '/page/44' },
      { id: 45, name: 'Анхан шатны баримт', url: '/page/45' },
      { id: 54, name: 'Нягтлан бодох бүртгэл', url: '/page/54' }
    ]
  },
  {
    id: 8,
    name: 'ГАР УТАС',
    icon: '📱',
    subcategories: [
      { id: 59, name: 'Тоглоом', url: '/page/59' },
      { id: 60, name: 'Програм', url: '/page/60' }
    ]
  }
]

// Default featured products data (fallback)
const defaultFeaturedProducts = [
  {
    id: 1,
    title: 'Монгол улсын эдийн засгийн хөгжил',
    category: 'Реферат',
    price: 1000,
    pages: 25,
    downloads: 234,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop'
  },
  {
    id: 2,
    title: 'Компьютерийн сүлжээний аюулгүй байдал',
    category: 'Дипломын ажил',
    price: 1000,
    pages: 80,
    downloads: 156,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop'
  },
  {
    id: 3,
    title: 'Action Adventure Game Pack',
    category: 'Тоглоом (EXE)',
    price: 1000,
    size: '2.5 GB',
    downloads: 892,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=250&fit=crop'
  },
  {
    id: 4,
    title: 'Мэдээллийн системийн дизайн',
    category: 'Курсын ажил',
    price: 1000,
    pages: 35,
    downloads: 178,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop'
  },
  {
    id: 5,
    title: 'Office Suite Pro 2024',
    category: 'Программ хангамж',
    price: 1000,
    size: '500 MB',
    downloads: 445,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop'
  },
  {
    id: 6,
    title: 'Монгол хэлний утга зохиол',
    category: 'Реферат',
    price: 1000,
    pages: 20,
    downloads: 312,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop'
  },
  {
    id: 7,
    title: 'Photoshop Template Collection',
    category: 'График дизайн',
    price: 1000,
    size: '150 MB',
    downloads: 567,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=250&fit=crop'
  },
  {
    id: 8,
    title: 'Монголын түүх судлал',
    category: 'Реферат',
    price: 1000,
    pages: 28,
    downloads: 289,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop'
  }
]


// Product type definition
type Product = {
  id: number | string;
  title: string;
  category: { id: number; name: string; icon?: string } | string;
  price: number;
  pages?: number;
  size?: string;
  downloads: number;
  rating: number;
  image: string;
  [key: string]: any; // Allow additional properties
}

export default function Home() {
  const router = useRouter()
  const { isDark, toggle: toggleDarkMode } = useDarkMode()
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const [isJournalist, setIsJournalist] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState(defaultCategories)
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(defaultFeaturedProducts)
  const [topBloggers, setTopBloggers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

    // Fetch data from API
    const fetchData = async () => {
      try {
        setLoading(true)
        const [categoriesRes, productsRes, journalistsRes] = await Promise.all([
          getCategories().catch(() => ({ categories: defaultCategories })),
          getFeaturedProducts(8).catch(() => ({ products: defaultFeaturedProducts })),
          getTopJournalists(4).catch(() => ({ journalists: [] }))
        ])

        if (categoriesRes.categories) {
          // Filter to only show parent categories (those with subcategories)
          // This excludes subcategories that might be returned as separate items
          // Also exclude generic category names like "Category 37", "Category 40", etc.
          const filteredCategories = categoriesRes.categories.filter((cat: any) => {
            // Skip categories with generic names like "Category 37", "Category 40", etc.
            const isGenericCategory = /^Category\s+\d+$/i.test(cat.name)
            if (isGenericCategory) {
              return false
            }
            
            // Only show categories that have subcategories (parent categories)
            // OR are in the defaultCategories list (known parent categories)
            const parentCategoryIds = defaultCategories.map((c: any) => c.id)
            const hasSubcategories = cat.subcategories && Array.isArray(cat.subcategories) && cat.subcategories.length > 0
            const isDefaultParent = parentCategoryIds.includes(cat.id)
            return hasSubcategories || isDefaultParent
          })
          setCategories(filteredCategories.length > 0 ? filteredCategories : defaultCategories)
        }
        if (productsRes.products) {
          setFeaturedProducts(productsRes.products)
        }
        if (journalistsRes.journalists && Array.isArray(journalistsRes.journalists)) {
          // Format followers number to display format (e.g., 12500 -> "12.5K")
          const formattedJournalists = journalistsRes.journalists.map((j: any) => ({
            ...j,
            followers: typeof j.followers === 'number' 
              ? j.followers >= 1000 
                ? (j.followers / 1000).toFixed(1) + 'K'
                : j.followers.toString()
              : j.followers
          }))
          setTopBloggers(formattedJournalists)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.category-dropdown')) {
        setOpenDropdown(null)
      }
    }
    
    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  const filteredProducts = featuredProducts.filter(p => {
    // Get category name (handle both string and object)
    const categoryName = typeof p.category === 'object' && p.category?.name 
      ? p.category.name 
      : typeof p.category === 'string' 
      ? p.category 
      : ''
    
    // Filter by category if selected
    if (selectedCategory) {
      const categoryMap: { [key: number]: string[] } = {
        1: ['Реферат', 'Курсын ажил', 'Дипломын ажил'],
        2: ['Реферат', 'Дипломын ажил'],
        3: ['Реферат', 'График дизайн'],
        4: ['Программ хангамж'],
        5: ['Тоглоом (EXE)'],
        6: ['Реферат'],
        7: ['Реферат'],
        8: ['Тоглоом (EXE)']
      }
      const categoryNames = categoryMap[selectedCategory] || []
      if (!categoryNames.includes(categoryName)) return false
    }
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return p.title.toLowerCase().includes(query) || 
             categoryName.toLowerCase().includes(query)
    }
    return true
  })

  // Show only first 8 products (2 rows x 4 columns)
  const displayedProducts = filteredProducts.slice(0, 8)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Ачааллаж байна...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className={`shadow-sm sticky top-0 z-50 ${isDark ? 'bg-gray-900' : 'bg-white'}`} style={{ backgroundColor: isDark ? '#111827' : '#ffffff' }}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-gray-900' : 'bg-white'}`} style={{ backgroundColor: isDark ? '#111827' : '#ffffff' }}>
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🛒</span>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                tbarimt
              </h1>
            </div>
            <nav className="hidden md:flex space-x-6 items-center">
              <button 
                onClick={() => router.push('/')}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
              >
                Нүүр
              </button>
              <button 
                onClick={() => router.push('/products')}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
              >
                Бүтээгдэхүүн
              </button>
              <button 
                onClick={() => router.push('/about')}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
              >
                Бидний тухай
              </button>
              <button 
                onClick={() => router.push('/contact')}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
              >
                Холбоо барих
              </button>
            </nav>
            <div className="flex items-center space-x-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDark ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              {isJournalist && (
                <button 
                  onClick={() => router.push('/account/journalist')}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg font-semibold flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Шинэ контент нийтлэх</span>
                </button>
              )}
              {!isJournalist && (
                <button 
                  onClick={() => {
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                    // Remove trailing /api if present to avoid double /api/api/
                    const baseUrl = API_URL.trim().endsWith('/api') 
                      ? API_URL.trim().slice(0, -4) 
                      : API_URL.trim()
                    window.location.href = `${baseUrl}/api/auth/google`
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-all shadow-md hover:shadow-lg font-semibold flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Google-аар нэвтрэх</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Бүх төрлийн контент
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              нэг дороос
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Реферат, дипломын ажил, тоглоом, програм хангамж болон бусад бүх төрлийн контент
          </p>
          
          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="relative group">
              {/* Animated background gradient */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl opacity-20 group-hover:opacity-30 blur transition-opacity duration-300"></div>
              
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                <div className="flex items-center">
                  {/* Search Icon */}
                  <div className="pl-6 pr-4 flex items-center">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Input Field */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && searchQuery) {
                        router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
                      }
                    }}
                    placeholder="Хайх... (жишээ: реферат, дипломын ажил, тоглоом)"
                    className="flex-1 py-5 text-lg bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none pr-4"
                  />
                  
                  {/* Clear Button */}
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-2 mr-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Search Button */}
                  <button
                    onClick={() => {
                      if (searchQuery) {
                        router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
                      }
                    }}
                    disabled={!searchQuery}
                    className="m-2 px-8 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
                  >
                    <span>Хайх</span>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              Бүтээгдэхүүн үзэх
            </button>
            <button className="border-2 border-blue-600 text-blue-600 dark:text-blue-400 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 dark:hover:bg-gray-800 transition-all hover:shadow-md">
              Дэлгэрэнгүй
            </button>
          </div>
        </div>
      </section>

      {/* Advertisement Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 p-8 md:p-12 shadow-2xl">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
            <div className="flex-1 mb-6 md:mb-0">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                🎉 Онцгой санал! 🎉
              </h3>
              <p className="text-xl text-white/90 mb-4">
                Энэ сард бүх дипломын ажлууд <span className="font-bold text-yellow-300">20% хямдралтай</span>
              </p>
              <p className="text-lg text-white/80">
                Хязгаарлагдмал хугацаатай санал - зөвхөн энэ долоо хоногт
              </p>
            </div>
            <div className="flex-shrink-0">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                Одоо захиалах →
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Ангилалууд
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Бүх төрлийн контент ангилалаар нь хайж олоорой
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="relative category-dropdown"
              onMouseEnter={() => setOpenDropdown(category.id)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                onClick={() => {
                  router.push(`/category/${category.id}`)
                }}
                className={`w-full p-3 md:p-4 rounded-lg border-2 transition-all duration-300 text-center transform hover:-translate-y-0.5 ${
                  selectedCategory === category.id
                    ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 dark:border-blue-400 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-3xl md:text-4xl mb-2 transform hover:scale-110 transition-transform">
                    {category.icon}
                  </span>
                  <h4 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white leading-tight">
                    {category.name}
                  </h4>
                  {category.subcategories.length > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {category.subcategories.length}
                    </span>
                  )}
                </div>
              </button>
              
              {/* Dropdown Menu */}
              {openDropdown === category.id && category.subcategories.length > 0 && (
                <div className={`absolute top-full mt-2 w-64 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 max-h-96 overflow-y-auto ${
                  category.id >= 5 ? 'right-0' : 'left-0'
                }`}>
                  {category.subcategories.map((subcategory) => (
                    <button
                      key={subcategory.id}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        router.push(subcategory.url)
                        setOpenDropdown(null)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {subcategory.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Top Bloggers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Шилдэг нийтлэлчид
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Манай платформ дээрх хамгийн идэвхтэй, чанартай контент бүтээгчдэд тавтай морил
          </p>
        </div>
        {topBloggers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topBloggers.map((blogger) => (
              <div
                key={blogger.id || blogger.userId}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700 transform hover:-translate-y-2 text-center"
              >
                <div className="relative mb-4 inline-block">
                  <img
                    src={blogger.avatar || '/placeholder.png'}
                    alt={blogger.name || 'Journalist'}
                    className="w-20 h-20 rounded-full border-4 border-blue-500 dark:border-blue-400 shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (blogger.name || 'default');
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {blogger.name || 'Unknown'}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {blogger.username || '@unknown'}
                </p>
                <div className="flex items-center justify-center space-x-1 mb-4">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {parseFloat(blogger.rating) || 0}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Дагагчид:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{blogger.followers || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Нийтлэл:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{blogger.posts || 0}</span>
                  </div>
                  {blogger.specialty && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Мэргэжил:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{blogger.specialty}</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => router.push(`/journalist/${blogger.userId || blogger.id}`)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-semibold shadow-md hover:shadow-lg"
                >
                  Профайл үзэх
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Шилдэг нийтлэлчид олдсонгүй
            </p>
          </div>
        )}
      </section>

      {/* Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
            Онцлох бүтээгдэхүүн
          </h3>
          {(selectedCategory || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory(null)
                setSearchQuery('')
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Бүгдийг харуулах
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayedProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => router.push(`/products/${product.uuid || product.id}`)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 transform hover:-translate-y-2 group cursor-pointer"
            >
              {/* Product Image */}
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="absolute top-3 right-3 flex items-center space-x-1 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-full">
                  <span className="text-yellow-400 text-sm">⭐</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {product.rating}
                  </span>
                </div>
                <div className="absolute top-3 left-3">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-md">
                    {typeof product.category === 'object' && product.category?.name
                      ? product.category.name
                      : typeof product.category === 'string'
                      ? product.category
                      : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {product.title}
                </h4>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <span className="flex items-center space-x-1">
                    <span>📄</span>
                    <span>{product.pages ? `${product.pages} хуудас` : product.size}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>⬇️</span>
                    <span>{product.downloads}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 gap-3">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {product.price.toLocaleString()}₮
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/products/${product.id}`)
                    }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-xs font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    Дэлгэрэнгүй
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {displayedProducts.length > 0 && (
          <div className="text-center mt-10">
            <button
              onClick={() => router.push('/products')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center space-x-2"
            >
              <span>бүх контент харах</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h5 className="text-white font-semibold mb-4">tbarimt</h5>
              <p className="text-sm">
                Бүх төрлийн контент нэг дороос. Чанартай, найдвартай бүтээгдэхүүн.
              </p>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">Холбоос</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => router.push('/')} className="hover:text-white transition-colors">
                    Нүүр
                  </button>
                </li>
                <li>
                  <button onClick={() => router.push('/products')} className="hover:text-white transition-colors">
                    Бүтээгдэхүүн
                  </button>
                </li>
                <li>
                  <button onClick={() => router.push('/about')} className="hover:text-white transition-colors">
                    Бидний тухай
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">Тусламж</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => router.push('/contact')} className="hover:text-white transition-colors">
                    Холбоо барих
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">Холбоо барих</h5>
              <ul className="space-y-2 text-sm">
                <li>📧 info@content.mn</li>
                <li>📱 9911-2233</li>
                <li>📍 Улаанбаатар хот</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2024 tbarimt. Бүх эрх хуулиар хамгаалагдсан.</p>
            <p className="mt-2 text-gray-400">tbarimt.com</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
