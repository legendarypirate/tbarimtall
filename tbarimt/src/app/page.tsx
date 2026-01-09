'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useLanguage } from '@/contexts/LanguageContext'
import { getTranslation } from '@/lib/translations'
import { getCategories, getFeaturedProducts, getTopJournalists } from '@/lib/api'
import { getCategoryIcon } from '@/lib/categoryIcon'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WishlistHeartIcon from '@/components/WishlistHeartIcon'

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
  const { language } = useLanguage()
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState(defaultCategories)
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(defaultFeaturedProducts)
  const [topBloggers, setTopBloggers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {

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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#004e6c] dark:border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-[#004e6c] dark:text-gray-200 text-lg font-medium">{getTranslation(language, 'loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Hero Section */}
      <section className="relative w-full py-24 md:py-32 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
          }}
        >
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#004e6c]/85 via-[#004e6c]/75 to-[#004e6c]/85"></div>
        </div>
        
        {/* Abstract background graphics */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-[#004e6c]/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#ff6b35]/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#004e6c]/10 rounded-full blur-3xl"></div>
        </div>
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight drop-shadow-lg">
              {getTranslation(language, 'heroTitle')}
              <span className="block mt-2 text-[#ff6b35] drop-shadow-md">
                {getTranslation(language, 'heroSubtitle')}
              </span>
            </h2>
          
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <button 
                onClick={() => router.push('/products')}
                className="bg-[#004e6c] dark:bg-[#006b8f] text-white px-10 py-4 rounded-2xl text-lg font-bold hover:bg-[#ff6b35] dark:hover:bg-[#ff8555] transition-all duration-300 shadow-2xl hover:shadow-[#ff6b35]/50 transform hover:-translate-y-1"
              >
                {getTranslation(language, 'viewAllContent')}
              </button>
              <button 
                onClick={() => router.push('/products')}
                className="bg-white dark:bg-gray-800 text-[#004e6c] dark:text-gray-200 border-2 border-[#004e6c] dark:border-gray-600 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-[#004e6c] dark:hover:bg-[#006b8f] hover:text-white hover:border-[#ff6b35] dark:hover:border-[#ff8555] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                {getTranslation(language, 'addYourContent')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-12 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Users Stat */}
          <div className="bg-white dark:bg-gray-800 border border-[#004e6c]/15 dark:border-gray-700 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:border-[#ff6b35]/30 dark:hover:border-[#ff6b35]/50 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff6b35]/8 dark:bg-[#ff6b35]/15 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-[#ff6b35]/15 dark:group-hover:bg-[#ff6b35]/25 transition-all"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:from-[#ff6b35] group-hover:to-[#ff8555] group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-[#004e6c] dark:text-gray-200 mb-2 group-hover:text-[#ff6b35] transition-colors">
                10,742
              </div>
              <div className="text-[#004e6c]/60 dark:text-gray-400 font-medium text-sm">
                {getTranslation(language, 'users')}
              </div>
            </div>
          </div>

          {/* Creators Stat */}
          <div className="bg-white dark:bg-gray-800 border border-[#004e6c]/15 dark:border-gray-700 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:border-[#ff6b35]/30 dark:hover:border-[#ff6b35]/50 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff6b35]/8 dark:bg-[#ff6b35]/15 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-[#ff6b35]/15 dark:group-hover:bg-[#ff6b35]/25 transition-all"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:from-[#ff6b35] group-hover:to-[#ff8555] group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-[#004e6c] dark:text-gray-200 mb-2 group-hover:text-[#ff6b35] transition-colors">
                1,204
              </div>
              <div className="text-[#004e6c]/60 dark:text-gray-400 font-medium text-sm">
                {getTranslation(language, 'creators')}
              </div>
            </div>
          </div>

          {/* Contents Stat */}
          <div className="bg-white dark:bg-gray-800 border border-[#004e6c]/15 dark:border-gray-700 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:border-[#ff6b35]/30 dark:hover:border-[#ff6b35]/50 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff6b35]/8 dark:bg-[#ff6b35]/15 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-[#ff6b35]/15 dark:group-hover:bg-[#ff6b35]/25 transition-all"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:from-[#ff6b35] group-hover:to-[#ff8555] group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-[#004e6c] dark:text-gray-200 mb-2 group-hover:text-[#ff6b35] transition-colors">
                9,300
              </div>
              <div className="text-[#004e6c]/60 dark:text-gray-400 font-medium text-sm">
                {getTranslation(language, 'contents')}
              </div>
            </div>
          </div>

          {/* Earned Stat */}
          <div className="bg-white dark:bg-gray-800 border border-[#004e6c]/15 dark:border-gray-700 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:border-[#ff6b35]/30 dark:hover:border-[#ff6b35]/50 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff6b35]/8 dark:bg-[#ff6b35]/15 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-[#ff6b35]/15 dark:group-hover:bg-[#ff6b35]/25 transition-all"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:from-[#ff6b35] group-hover:to-[#ff8555] group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-[#004e6c] dark:text-gray-200 mb-2 group-hover:text-[#ff6b35] transition-colors">
                T116,400
              </div>
              <div className="text-[#004e6c]/60 dark:text-gray-400 font-medium text-sm">
                {getTranslation(language, 'earned')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white dark:bg-gray-900">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-3xl md:text-4xl font-bold text-[#004e6c] dark:text-gray-200">
            {getTranslation(language, 'allCategories')}
          </h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* All Categories Button */}
          <button
            onClick={() => {
              setSelectedCategory(null)
              setSearchQuery('')
            }}
            className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 flex items-center space-x-2 ${
              selectedCategory === null
                ? 'bg-[#004e6c] dark:bg-[#006b8f] text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-[#004e6c] dark:text-gray-200 border-2 border-[#004e6c]/20 dark:border-gray-700 hover:border-[#004e6c]/40 dark:hover:border-gray-600 hover:shadow-md'
            }`}
          >
            <span>{getTranslation(language, 'all')}</span>
          </button>
          
          {/* Category Buttons */}
          {categories.map((category) => {
            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id)
                  router.push(`/category/${category.id}`)
                }}
                className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 flex items-center space-x-2 ${
                  selectedCategory === category.id
                    ? 'bg-[#004e6c] dark:bg-[#006b8f] text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-[#004e6c] dark:text-gray-200 border-2 border-[#004e6c]/20 dark:border-gray-700 hover:border-[#004e6c]/40 dark:hover:border-gray-600 hover:shadow-md'
                }`}
              >
                <span className="flex-shrink-0 text-xl">
                  {getCategoryIcon(category.icon)}
                </span>
                <span>{category.name}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative w-full py-12 overflow-hidden bg-gray-200 dark:bg-gray-800">
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* TBARIMT Logo - Centered Above */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center">
              <div className="h-20 rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/lg.png" alt="TBARIMT Logo" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

          {/* Features Grid - 2x2 Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {/* Feature 1: Secure & Verified */}
            <div className="flex items-center space-x-3 text-left group p-3 rounded-lg hover:bg-[#004e6c]/5 dark:hover:bg-[#004e6c]/10 transition-all duration-200">
              <div className="flex-shrink-0 w-10 h-10 bg-[#004e6c] dark:bg-[#006b8f] rounded-lg flex items-center justify-center group-hover:bg-[#ff6b35] dark:group-hover:bg-[#ff8555] transition-colors duration-200">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium text-[#004e6c] dark:text-gray-200">
                  {getTranslation(language, 'secureAndVerified')}
                </h3>
              </div>
            </div>

            {/* Feature 2: Earn More Revenue */}
            <div className="flex items-center space-x-3 text-left group p-3 rounded-lg hover:bg-[#004e6c]/5 dark:hover:bg-[#004e6c]/10 transition-all duration-200">
              <div className="flex-shrink-0 w-10 h-10 bg-[#004e6c] dark:bg-[#006b8f] rounded-lg flex items-center justify-center group-hover:bg-[#ff6b35] dark:group-hover:bg-[#ff8555] transition-colors duration-200">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium text-[#004e6c] dark:text-gray-200">
                  {getTranslation(language, 'earnMoreRevenue')}
                </h3>
              </div>
            </div>

            {/* Feature 3: Bromes Center */}
            <div className="flex items-center space-x-3 text-left group p-3 rounded-lg hover:bg-[#004e6c]/5 dark:hover:bg-[#004e6c]/10 transition-all duration-200">
              <div className="flex-shrink-0 w-10 h-10 bg-[#004e6c] dark:bg-[#006b8f] rounded-lg flex items-center justify-center group-hover:bg-[#ff6b35] dark:group-hover:bg-[#ff8555] transition-colors duration-200">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium text-[#004e6c] dark:text-gray-200">
                  {getTranslation(language, 'bromesCenter')}
                </h3>
              </div>
            </div>

            {/* Feature 4: Diverse Content Marketplace */}
            <div className="flex items-center space-x-3 text-left group p-3 rounded-lg hover:bg-[#004e6c]/5 dark:hover:bg-[#004e6c]/10 transition-all duration-200">
              <div className="flex-shrink-0 w-10 h-10 bg-[#004e6c] dark:bg-[#006b8f] rounded-lg flex items-center justify-center group-hover:bg-[#ff6b35] dark:group-hover:bg-[#ff8555] transition-colors duration-200">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 002 2 2 2 0 002-2v-1a2 2 0 012-2h2.945M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium text-[#004e6c] dark:text-gray-200">
                  {getTranslation(language, 'diverseContentMarketplace')}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner Section */}
      <section className="relative w-full py-24 overflow-hidden bg-[#004e6c] dark:bg-gray-800">
        {/* Abstract background graphics */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#ff6b35]/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 dark:bg-gray-600/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-4xl lg:text-5xl font-extrabold text-white dark:text-gray-200 mb-6">
            {getTranslation(language, 'whyTitle')}
          </h2>
          <p className="text-xl md:text-1xl text-white/90 dark:text-gray-300 mb-10 max-w-1xl mx-auto font-medium">
            {getTranslation(language, 'whyDescription')}
          </p>
          <button 
            onClick={() => router.push('/products')}
            className="bg-[#ff6b35] dark:bg-[#ff8555] text-white px-12 py-5 rounded-2xl text-lg font-bold hover:bg-[#ff8555] dark:hover:bg-[#ff6b35] transition-all shadow-2xl hover:shadow-[#ff6b35]/50 transform hover:-translate-y-1"
          >
            {getTranslation(language, 'joinForFree')}
          </button>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white dark:bg-gray-900">
        <div className="flex justify-between items-center mb-12">
          <h3 className="text-xl md:text-2xl font-medium text-[#004e6c] dark:text-gray-200">
            {getTranslation(language, 'featuredProducts')}
          </h3>
          {(selectedCategory || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory(null)
                setSearchQuery('')
              }}
              className="text-[#004e6c] dark:text-gray-300 hover:text-[#ff6b35] dark:hover:text-[#ff8555] font-semibold text-lg underline decoration-2 underline-offset-4 transition-colors"
            >
              {getTranslation(language, 'showAll')}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {displayedProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => router.push(`/products/${product.uuid || product.id}`)}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-[#004e6c]/10 dark:border-gray-700 transform hover:-translate-y-3 hover:border-[#004e6c]/30 dark:hover:border-gray-600 group cursor-pointer"
            >
              {/* Product Image */}
              <div className="relative h-52 overflow-hidden bg-gradient-to-br from-[#004e6c]/10 dark:from-gray-700/20 to-[#006b8f]/10 dark:to-gray-600/20">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#004e6c]/20 dark:from-gray-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {/* Star Rating and Wishlist Icon - positioned together on the right */}
                <div className="absolute top-4 right-4 flex items-center space-x-2">
                  {/* Wishlist Heart Icon */}
                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-2 rounded-full shadow-lg">
                    <WishlistHeartIcon 
                      productId={product.uuid || product.id} 
                      size="md"
                    />
                  </div>
                  {/* Star Rating */}
                  <div className="flex items-center space-x-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                    <span className="text-yellow-400 text-sm">⭐</span>
                    <span className="text-xs font-bold text-[#004e6c] dark:text-gray-200">
                      {product.rating}
                    </span>
                  </div>
                </div>
                {/* Category Badge - positioned at bottom left */}
                <div className="absolute bottom-4 left-4">
                  <span className="text-xs font-bold text-white bg-[#004e6c] dark:bg-[#006b8f] px-3 py-1.5 rounded-full shadow-lg group-hover:bg-[#ff6b35] dark:group-hover:bg-[#ff8555] transition-colors">
                    {typeof product.category === 'object' && product.category?.name
                      ? product.category.name
                      : typeof product.category === 'string'
                      ? product.category
                      : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h4 className="text-lg font-bold text-[#004e6c] dark:text-gray-200 mb-4 line-clamp-2 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors min-h-[3.5rem]">
                  {product.title}
                </h4>
                <div className="flex items-center justify-between text-sm text-[#004e6c]/70 dark:text-gray-400 mb-5 font-medium">
                  <span className="flex items-center space-x-2">
                    <span>📄</span>
                    <span>{product.pages ? `${product.pages} ${getTranslation(language, 'pages')}` : product.size}</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <span>⬇️</span>
                    <span>{product.downloads}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between pt-5 border-t-2 border-[#004e6c]/10 dark:border-gray-700 gap-3">
                  <span className="text-2xl font-extrabold text-[#004e6c] dark:text-gray-200 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
                    {product.price.toLocaleString()}₮
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/products/${product.id}`)
                    }}
                    className="bg-[#004e6c] dark:bg-[#006b8f] text-white w-10 h-10 rounded-xl hover:bg-[#ff6b35] dark:hover:bg-[#ff8555] transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center group"
                    aria-label={getTranslation(language, 'details')}
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
              className="bg-[#004e6c] dark:bg-[#006b8f] text-white px-12 py-5 rounded-2xl text-lg font-bold hover:bg-[#ff6b35] dark:hover:bg-[#ff8555] transition-all shadow-2xl hover:shadow-[#ff6b35]/50 transform hover:-translate-y-1 inline-flex items-center space-x-3"
            >
              <span>{getTranslation(language, 'viewAllContentButton')}</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </section>

      <Footer />
    </main>
  )
}
