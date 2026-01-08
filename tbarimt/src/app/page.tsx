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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#004e6c] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-[#004e6c] text-lg font-medium">Ачааллаж байна...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Top Header - Logo, Search, Upload/Dipbard */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#004e6c]/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => router.push('/')}>
              <div className="w-10 h-10 bg-[#004e6c] rounded-lg flex items-center justify-center shadow-lg group-hover:bg-[#ff6b35] group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <h1 className="text-2xl font-bold text-[#004e6c] group-hover:text-[#ff6b35] transition-colors">
                TBARIMT
              </h1>
            </div>
            
            {/* Search Bar */}
            <div className="flex flex-1 max-w-md mx-4 md:mx-8">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-[#004e6c]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchQuery) {
                      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
                    }
                  }}
                  placeholder="Хайх..."
                  className="block w-full pl-12 pr-4 py-3 border-2 border-[#004e6c]/20 rounded-xl bg-white text-[#004e6c] placeholder-[#004e6c]/40 focus:outline-none focus:ring-2 focus:ring-[#004e6c]/30 focus:border-[#004e6c] text-sm font-medium transition-all shadow-sm hover:shadow-md"
                />
              </div>
            </div>
            
            {/* Upload and Dipbard Buttons */}
            <div className="flex items-center space-x-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2.5 rounded-xl text-[#004e6c] hover:bg-[#004e6c]/10 transition-all duration-200"
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
                    onClick={() => router.push('/account/journalist')}
                    className="bg-[#004e6c] text-white px-5 py-2.5 rounded-xl hover:bg-[#ff6b35] transition-all duration-300 font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <span>Upload</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                    const baseUrl = API_URL.trim().endsWith('/api') 
                      ? API_URL.trim().slice(0, -4) 
                      : API_URL.trim()
                    window.location.href = `${baseUrl}/api/auth/google`
                  }}
                  className="bg-[#004e6c] text-white px-5 py-2.5 rounded-xl hover:bg-[#ff6b35] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Upload
                </button>
              )}
              
              <button 
                onClick={() => router.push('/dashboard')}
                className="bg-[#004e6c] text-white px-5 py-2.5 rounded-xl hover:bg-[#ff6b35] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Dipbard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Navigation Bar */}
      <nav className="bg-[#004e6c] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <h2 className="text-lg font-bold text-white">
                TBARIMT
              </h2>
            </div>
            <div className="flex items-center space-x-8">
              <button 
                onClick={() => router.push('/products')}
                className="text-white/90 hover:text-white transition-colors font-semibold text-sm relative group"
              >
                Categories
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </button>
              <button 
                onClick={() => router.push('/about')}
                className="text-white/90 hover:text-white transition-colors font-semibold text-sm relative group"
              >
                How it Works
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </button>
              <button 
                onClick={() => router.push('/pricing')}
                className="text-white/90 hover:text-white transition-colors font-semibold text-sm relative group"
              >
                Pricing
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full py-24 md:py-32 overflow-hidden bg-gradient-to-br from-[#004e6c]/5 via-white to-[#ff6b35]/5">
        {/* Abstract background graphics */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-[#004e6c]/15 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#ff6b35]/15 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#004e6c]/5 rounded-full blur-3xl"></div>
        </div>
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23004e6c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#004e6c] mb-6 leading-tight tracking-tight">
              Sell & Buy Digital Contents
              <span className="block mt-2 text-[#ff6b35]">
                Securely
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-[#004e6c]/70 mb-12 max-w-3xl mx-auto font-medium">
              Explore and earn with thousands of premium digital contents
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <button 
                onClick={() => router.push('/products')}
                className="bg-[#004e6c] text-white px-10 py-4 rounded-2xl text-lg font-bold hover:bg-[#ff6b35] transition-all duration-300 shadow-2xl hover:shadow-[#ff6b35]/50 transform hover:-translate-y-1"
              >
                Explore Marketplace
              </button>
              <button 
                onClick={() => isJournalist ? router.push('/account/journalist') : router.push('/products')}
                className="bg-white text-[#004e6c] border-2 border-[#004e6c] px-10 py-4 rounded-2xl text-lg font-bold hover:bg-[#004e6c] hover:text-white hover:border-[#ff6b35] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                Upload Your Content
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-12 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Users Stat */}
          <div className="bg-white border border-[#004e6c]/15 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:border-[#ff6b35]/30 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff6b35]/8 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-[#ff6b35]/15 transition-all"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-[#004e6c] to-[#006b8f] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:from-[#ff6b35] group-hover:to-[#ff8555] group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-[#004e6c] mb-2 group-hover:text-[#ff6b35] transition-colors">
                10,742
              </div>
              <div className="text-[#004e6c]/60 font-medium text-sm">
                Users
              </div>
            </div>
          </div>

          {/* Creators Stat */}
          <div className="bg-white border border-[#004e6c]/15 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:border-[#ff6b35]/30 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff6b35]/8 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-[#ff6b35]/15 transition-all"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-[#004e6c] to-[#006b8f] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:from-[#ff6b35] group-hover:to-[#ff8555] group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-[#004e6c] mb-2 group-hover:text-[#ff6b35] transition-colors">
                1,204
              </div>
              <div className="text-[#004e6c]/60 font-medium text-sm">
                Creators
              </div>
            </div>
          </div>

          {/* Contents Stat */}
          <div className="bg-white border border-[#004e6c]/15 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:border-[#ff6b35]/30 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff6b35]/8 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-[#ff6b35]/15 transition-all"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-[#004e6c] to-[#006b8f] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:from-[#ff6b35] group-hover:to-[#ff8555] group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-[#004e6c] mb-2 group-hover:text-[#ff6b35] transition-colors">
                9,300
              </div>
              <div className="text-[#004e6c]/60 font-medium text-sm">
                Contents
              </div>
            </div>
          </div>

          {/* Earned Stat */}
          <div className="bg-white border border-[#004e6c]/15 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:border-[#ff6b35]/30 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff6b35]/8 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-[#ff6b35]/15 transition-all"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-[#004e6c] to-[#006b8f] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:from-[#ff6b35] group-hover:to-[#ff8555] group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-[#004e6c] mb-2 group-hover:text-[#ff6b35] transition-colors">
                T116,400
              </div>
              <div className="text-[#004e6c]/60 font-medium text-sm">
                Earned
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="flex justify-between items-center mb-12">
          <h3 className="text-3xl md:text-4xl font-extrabold text-[#004e6c]">
            Stats Row
          </h3>
          <div className="text-sm font-semibold text-[#004e6c]/70 hover:text-[#ff6b35] transition-colors cursor-pointer">
            2534t Manbaris &gt;&gt;
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.slice(0, 4).map((category, index) => {
            // Category names matching the design
            const categoryNames = ['Business', 'Design', 'Software', 'Marketing']
            const categoryPrices = ['41k', '73k', '173k', '50k']
            const categoryDescriptions = [
              'Paettamiary zолон...',
              'Pueciadoream...',
              'Fer/Crotams...',
              'Poettoer omaricruteselare...'
            ]
            
            // Icon components for each category
            const categoryIcons = [
              // Business/Education icon
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>,
              // Design/Graphics icon
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>,
              // Software/Code icon
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>,
              // Marketing/Business icon
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ]
            
            // Background gradients for each category
            const categoryBackgrounds = [
              'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700',
              'bg-gradient-to-br from-purple-500 via-pink-500 to-rose-600',
              'bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700',
              'bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600'
            ]
            
            return (
              <div
                key={category.id}
                onClick={() => router.push(`/category/${category.id}`)}
                className="bg-white border-2 border-[#004e6c]/20 rounded-2xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 hover:border-[#004e6c]/40 group"
              >
                {/* Category Image with Icon and Tangible Background */}
                <div className={`w-full h-40 ${categoryBackgrounds[index]} flex items-center justify-center relative overflow-hidden`}>
                  {/* Pattern overlay for texture */}
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z'/%3E%3C/g%3E%3C/svg%3E")`,
                  }}></div>
                  
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-12 -mb-12"></div>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Icon */}
                  <div className="relative z-10 w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border-2 border-white/30">
                    {categoryIcons[index]}
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Title */}
                  <h4 className="text-xl font-bold text-[#004e6c] mb-3 group-hover:text-[#ff6b35] transition-colors">
                    {categoryNames[index] || category.name}
                  </h4>
                  
                  {/* Description */}
                  <p className="text-sm text-[#004e6c]/70 mb-4 line-clamp-2 font-medium">
                    {categoryDescriptions[index] || 'Premium digital content'}
                  </p>
                  
                  {/* Rating - 4 stars */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < 4
                            ? 'text-yellow-400 fill-current'
                            : 'text-[#004e6c]/20'
                        }`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  
                  {/* Price */}
                  <div className="text-2xl font-extrabold text-[#004e6c] group-hover:text-[#ff6b35] transition-colors">
                    〒{categoryPrices[index] || '0k'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative w-full py-12 overflow-hidden bg-white">
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* TBARIMT Logo - Centered Above */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 bg-[#004e6c] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <h2 className="text-2xl font-semibold text-[#004e6c]">
                TBARIMT
              </h2>
            </div>
          </div>

          {/* Features Grid - 2x2 Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {/* Feature 1: Secure & Verified */}
            <div className="flex items-center space-x-3 text-left group p-3 rounded-lg hover:bg-[#004e6c]/5 transition-all duration-200">
              <div className="flex-shrink-0 w-10 h-10 bg-[#004e6c] rounded-lg flex items-center justify-center group-hover:bg-[#ff6b35] transition-colors duration-200">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium text-[#004e6c]">
                  Secure & Verified
                </h3>
              </div>
            </div>

            {/* Feature 2: Earn More Revenue */}
            <div className="flex items-center space-x-3 text-left group p-3 rounded-lg hover:bg-[#004e6c]/5 transition-all duration-200">
              <div className="flex-shrink-0 w-10 h-10 bg-[#004e6c] rounded-lg flex items-center justify-center group-hover:bg-[#ff6b35] transition-colors duration-200">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium text-[#004e6c]">
                  Earn More Revenue
                </h3>
              </div>
            </div>

            {/* Feature 3: Bromes Center */}
            <div className="flex items-center space-x-3 text-left group p-3 rounded-lg hover:bg-[#004e6c]/5 transition-all duration-200">
              <div className="flex-shrink-0 w-10 h-10 bg-[#004e6c] rounded-lg flex items-center justify-center group-hover:bg-[#ff6b35] transition-colors duration-200">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium text-[#004e6c]">
                  Bromes Center
                </h3>
              </div>
            </div>

            {/* Feature 4: Diverse Content Marketplace */}
            <div className="flex items-center space-x-3 text-left group p-3 rounded-lg hover:bg-[#004e6c]/5 transition-all duration-200">
              <div className="flex-shrink-0 w-10 h-10 bg-[#004e6c] rounded-lg flex items-center justify-center group-hover:bg-[#ff6b35] transition-colors duration-200">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 002 2 2 2 0 002-2v-1a2 2 0 012-2h2.945M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium text-[#004e6c]">
                  Diverse Content Marketplace
                </h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner Section */}
      <section className="relative w-full py-24 overflow-hidden bg-[#004e6c]">
        {/* Abstract background graphics */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#ff6b35]/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6">
            Why TBARIMT
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto font-medium">
            Start Earning Today, Upload Your Content Now!
          </p>
          <button 
            onClick={() => isJournalist ? router.push('/account/journalist') : router.push('/products')}
            className="bg-[#ff6b35] text-white px-12 py-5 rounded-2xl text-lg font-bold hover:bg-[#ff8555] transition-all shadow-2xl hover:shadow-[#ff6b35]/50 transform hover:-translate-y-1"
          >
            Join for Free
          </button>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="flex justify-between items-center mb-12">
          <h3 className="text-xl md:text-2xl font-medium text-[#004e6c]">
            Онцлох бүтээгдэхүүн
          </h3>
          {(selectedCategory || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory(null)
                setSearchQuery('')
              }}
              className="text-[#004e6c] hover:text-[#ff6b35] font-semibold text-lg underline decoration-2 underline-offset-4 transition-colors"
            >
              Бүгдийг харуулах
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {displayedProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => router.push(`/products/${product.uuid || product.id}`)}
              className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-[#004e6c]/10 transform hover:-translate-y-3 hover:border-[#004e6c]/30 group cursor-pointer"
            >
              {/* Product Image */}
              <div className="relative h-52 overflow-hidden bg-gradient-to-br from-[#004e6c]/10 to-[#006b8f]/10">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#004e6c]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-4 right-4 flex items-center space-x-1.5 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                  <span className="text-yellow-400 text-sm">⭐</span>
                  <span className="text-xs font-bold text-[#004e6c]">
                    {product.rating}
                  </span>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="text-xs font-bold text-white bg-[#004e6c] px-3 py-1.5 rounded-full shadow-lg group-hover:bg-[#ff6b35] transition-colors">
                    {typeof product.category === 'object' && product.category?.name
                      ? product.category.name
                      : typeof product.category === 'string'
                      ? product.category
                      : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h4 className="text-lg font-bold text-[#004e6c] mb-4 line-clamp-2 group-hover:text-[#ff6b35] transition-colors min-h-[3.5rem]">
                  {product.title}
                </h4>
                <div className="flex items-center justify-between text-sm text-[#004e6c]/70 mb-5 font-medium">
                  <span className="flex items-center space-x-2">
                    <span>📄</span>
                    <span>{product.pages ? `${product.pages} хуудас` : product.size}</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <span>⬇️</span>
                    <span>{product.downloads}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between pt-5 border-t-2 border-[#004e6c]/10 gap-3">
                  <span className="text-2xl font-extrabold text-[#004e6c] group-hover:text-[#ff6b35] transition-colors">
                    {product.price.toLocaleString()}₮
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/products/${product.id}`)
                    }}
                    className="bg-[#004e6c] text-white w-10 h-10 rounded-xl hover:bg-[#ff6b35] transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center group"
                    aria-label="Дэлгэрэнгүй"
                  >
                    <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {displayedProducts.length > 0 && (
          <div className="text-center mt-14">
            <button
              onClick={() => router.push('/products')}
              className="bg-[#004e6c] text-white px-12 py-5 rounded-2xl text-lg font-bold hover:bg-[#ff6b35] transition-all shadow-2xl hover:shadow-[#ff6b35]/50 transform hover:-translate-y-1 inline-flex items-center space-x-3"
            >
              <span>бүх контент харах</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-[#004e6c] mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Navigation Links Row */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mb-10">
            <button 
              onClick={() => router.push('/terms')}
              className="text-white/90 hover:text-white transition-colors text-sm font-semibold relative group"
            >
              Terms
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </button>
            <button 
              onClick={() => router.push('/privacy')}
              className="text-white/90 hover:text-white transition-colors text-sm font-semibold relative group"
            >
              Privacy Policy
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </button>
            <button 
              onClick={() => router.push('/about')}
              className="text-white/90 hover:text-white transition-colors text-sm font-semibold relative group"
            >
              How It Works
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </button>
            <button 
              onClick={() => router.push('/pricing')}
              className="text-white/90 hover:text-white transition-colors text-sm font-semibold relative group"
            >
              Pricing
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </button>
            <button 
              onClick={() => router.push('/help')}
              className="text-white/90 hover:text-white transition-colors text-sm font-semibold relative group"
            >
              Help
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </button>
            <button 
              onClick={() => router.push('/mby')}
              className="text-white/90 hover:text-white transition-colors text-sm font-semibold relative group"
            >
              Mby
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </button>
            <button 
              onClick={() => router.push('/search')}
              className="text-white/90 hover:text-white transition-colors text-sm font-semibold relative group"
            >
              Q
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </button>
          </div>
          
          {/* Logo at Bottom Left */}
          <div className="flex items-center space-x-3 pt-8 border-t border-white/20">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <h5 className="text-2xl font-extrabold text-white">
              TBARIMT
            </h5>
          </div>
        </div>
      </footer>
    </main>
  )
}
