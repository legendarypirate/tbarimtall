'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useLanguage } from '@/contexts/LanguageContext'
import { getTranslation } from '@/lib/translations'
import { getCategories, getFeaturedProducts, getTopJournalists, getActiveMemberships, getHeroSliders, createMembershipInvoice, checkMembershipPaymentStatus, getBestSellingProducts, getRecentProducts } from '@/lib/api'
import { getCategoryIcon } from '@/lib/categoryIcon'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WishlistHeartIcon from '@/components/WishlistHeartIcon'
import AuthModal from '@/components/AuthModal'
import TermsAndConditionsModal from '@/components/TermsAndConditionsModal'

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
  const { language, setLanguage } = useLanguage()
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState(defaultCategories)
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(defaultFeaturedProducts)
  const [topBloggers, setTopBloggers] = useState<any[]>([])
  const [memberships, setMemberships] = useState<any[]>([])
  const [heroSliders, setHeroSliders] = useState<any[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(true)
  const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([])
  const [recentProducts, setRecentProducts] = useState<Product[]>([])
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [isJournalist, setIsJournalist] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrText, setQrText] = useState<string | null>(null)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false)
  const paymentPollingInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check if user is logged in as journalist and has accepted terms
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser)
        // User must be journalist AND have accepted terms
        setIsJournalist(user.role === 'journalist' && user.termsAccepted === true)
      } catch (e) {
        setIsJournalist(false)
      }
    } else {
      setIsJournalist(false)
    }
    
    // Reset auth modal state on mount to prevent stale state after navigation
    setShowAuthModal(false)
    
    // Clear OAuth flow flag if it exists (user came back from OAuth or interrupted flow)
    // This prevents issues when user starts OAuth but doesn't complete it
    if (typeof window !== 'undefined') {
      const oauthFlag = sessionStorage.getItem('oauth_flow_started')
      const oauthTimestamp = sessionStorage.getItem('oauth_flow_timestamp')
      
      // Check if we're on the callback page - if not, clear the flag
      // This handles the case where user started OAuth but left without completing
      if (!window.location.pathname.includes('/auth/callback')) {
        // If OAuth flag exists and it's been more than 10 minutes, clear it
        // This prevents stale flags from causing issues
        if (oauthFlag && oauthTimestamp) {
          const timestamp = parseInt(oauthTimestamp, 10)
          const now = Date.now()
          const tenMinutes = 10 * 60 * 1000 // 10 minutes in milliseconds
          
          if (now - timestamp > tenMinutes) {
            sessionStorage.removeItem('oauth_flow_started')
            sessionStorage.removeItem('oauth_flow_timestamp')
          }
        } else if (oauthFlag) {
          // If flag exists but no timestamp, clear it (old format)
          sessionStorage.removeItem('oauth_flow_started')
        }
      }
    }
  }, [])

  // Check if user is authenticated
  const isAuthenticated = () => {
    if (typeof window === 'undefined') return false
    const token = localStorage.getItem('token')
    return !!token
  }

  // Start polling for payment status
  const startPaymentPolling = (invoiceId: string) => {
    if (paymentPollingInterval.current) {
      clearInterval(paymentPollingInterval.current)
    }

    const checkPayment = async () => {
      try {
        const response = await checkMembershipPaymentStatus(invoiceId)
        if (response.success && response.order) {
          if (response.order.status === 'completed' || response.order.status === 'paid') {
            setPaymentStatus('completed')
            if (paymentPollingInterval.current) {
              clearInterval(paymentPollingInterval.current)
              paymentPollingInterval.current = null
            }
            // Refresh page after 2 seconds to show updated membership
            setTimeout(() => {
              window.location.reload()
            }, 2000)
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error)
      }
    }

    const interval = setInterval(checkPayment, 3000) // Check every 3 seconds
    paymentPollingInterval.current = interval
  }

  // Handle membership selection
  const handleMembershipSelect = async (membership: any) => {
    const isFree = typeof membership.price === 'number' ? membership.price === 0 : parseFloat(String(membership.price)) === 0
    
    // Free membership is not clickable
    if (isFree) {
      return
    }

    // Check if user is authenticated
    if (!isAuthenticated()) {
      setShowAuthModal(true)
      return
    }

    // User is authenticated, create invoice
    try {
      setIsCreatingInvoice(true)
      setPaymentError(null)

      const response = await createMembershipInvoice({
        membershipId: membership.id,
        extendOnly: false
      })

      if (response.success && response.invoice) {
        setInvoiceId(response.invoice.invoice_id)
        
        // Fix QR code: if it's a base64 string without prefix, add it
        let qrImage = response.invoice.qr_image || response.invoice.qr_code
        if (qrImage) {
          // Check if it's a base64 string without data URL prefix
          if (qrImage.startsWith('iVBORw0KGgo') || qrImage.startsWith('/9j/')) {
            // It's a base64 PNG or JPEG without prefix
            const prefix = qrImage.startsWith('iVBORw0KGgo') ? 'data:image/png;base64,' : 'data:image/jpeg;base64,'
            qrImage = prefix + qrImage
          } else if (!qrImage.startsWith('data:') && !qrImage.startsWith('http://') && !qrImage.startsWith('https://') && !qrImage.startsWith('/')) {
            // If it doesn't start with data:, http://, https://, or /, assume it's base64
            qrImage = 'data:image/png;base64,' + qrImage
          }
        }
        
        // Only set QR code if it's a valid data URL or HTTP URL
        if (qrImage && (qrImage.startsWith('data:') || qrImage.startsWith('http://') || qrImage.startsWith('https://'))) {
          setQrCode(qrImage)
        } else {
          setQrCode(null)
          console.error('Invalid QR code format:', qrImage?.substring(0, 50))
        }
        setQrText(response.invoice.qr_text)
        setShowPaymentModal(true)
        setPaymentStatus('pending')
        
        // Start polling for payment status
        startPaymentPolling(response.invoice.invoice_id)
      } else {
        throw new Error('Failed to create invoice')
      }
    } catch (error: any) {
      console.error('Error creating membership invoice:', error)
      
      // Check if error is due to authentication (401, Unauthorized, or Invalid token)
      const errorMessage = error.message || ''
      const isAuthError = 
        errorMessage.includes('401') || 
        errorMessage.includes('Unauthorized') || 
        errorMessage.includes('Invalid token') ||
        errorMessage.toLowerCase().includes('unauthorized')
      
      if (isAuthError) {
        // Clear invalid token and show auth modal
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setShowAuthModal(true)
        setPaymentError(null)
      } else {
        setPaymentError(errorMessage || 'Төлбөрийн хуудас үүсгэхэд алдаа гарлаа')
      }
    } finally {
      setIsCreatingInvoice(false)
    }
  }

  useEffect(() => {

    // Fetch data from API
    const fetchData = async () => {
      try {
        setLoading(true)
        const [categoriesRes, productsRes, journalistsRes, membershipsRes, slidersRes, bestSellingRes, recentRes] = await Promise.all([
          getCategories().catch(() => ({ categories: defaultCategories })),
          getFeaturedProducts(8).catch(() => ({ products: defaultFeaturedProducts })),
          getTopJournalists(12).catch(() => ({ journalists: [] })),
          getActiveMemberships().catch(() => ({ memberships: [] })),
          getHeroSliders().catch(() => ({ sliders: [] })),
          getBestSellingProducts(5).catch(() => ({ products: [] })),
          getRecentProducts(6).catch(() => ({ products: [] }))
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
          // Ensure all numeric values default to 0 if null/undefined
          // Keep followers as number for proper formatting in display
          const formattedJournalists = journalistsRes.journalists.map((j: any) => {
            const followers = typeof j.followers === 'number' ? j.followers : (parseInt(j.followers) || 0)
            const posts = typeof j.posts === 'number' ? j.posts : (parseInt(j.posts) || 0)
            const rating = typeof j.rating === 'number' ? j.rating : (parseFloat(j.rating) || 0)
            
            return {
              ...j,
              followers: followers,
              posts: posts,
              rating: rating
            }
          })
          setTopBloggers(formattedJournalists)
        }
        if (membershipsRes.memberships && Array.isArray(membershipsRes.memberships)) {
          setMemberships(membershipsRes.memberships)
        }
        if (slidersRes.sliders && Array.isArray(slidersRes.sliders)) {
          setHeroSliders(slidersRes.sliders)
        }
        if (bestSellingRes.products && Array.isArray(bestSellingRes.products)) {
          setBestSellingProducts(bestSellingRes.products.slice(0, 5))
        }
        if (recentRes.products && Array.isArray(recentRes.products)) {
          setRecentProducts(recentRes.products.slice(0, 6))
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Auto-advance carousel
  useEffect(() => {
    if (heroSliders.length <= 1) return
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSliders.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [heroSliders.length])

  // Reset current slide when sliders change
  useEffect(() => {
    if (heroSliders.length > 0 && currentSlide >= heroSliders.length) {
      setCurrentSlide(0)
    }
  }, [heroSliders.length, currentSlide])

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

  // Helper function to check if product is new (created within last 7 days)
  const isNewProduct = (product: Product) => {
    if (!product.createdAt) return false
    const createdAt = new Date(product.createdAt)
    const now = new Date()
    const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff <= 7 // New if created within last 7 days
  }

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

      {/* Hero Section - Carousel Slider - COMMENTED OUT */}
      {/*
      <section className="relative w-full overflow-hidden">
        <div className="relative w-full h-[480px] md:h-[560px]">
          {heroSliders.length === 0 ? (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#004e6c]/85 via-[#004e6c]/75 to-[#004e6c]/85"></div>
            </div>
          ) : (
            <>
              {heroSliders.map((slider, index) => (
                <div
                  key={slider.id}
                  className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
                    index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                  style={{
                    backgroundImage: `url('${slider.imageUrl}')`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#004e6c]/85 via-[#004e6c]/75 to-[#004e6c]/85"></div>
                </div>
              ))}
            </>
          )}
          
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-96 h-96 bg-[#004e6c]/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#ff6b35]/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#004e6c]/10 rounded-full blur-3xl"></div>
          </div>
          <div className="absolute inset-0 opacity-[0.05]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
            <div className="text-center">
              {heroSliders.length > 0 && heroSliders[currentSlide] ? (
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight drop-shadow-lg">
                  {heroSliders[currentSlide].title || getTranslation(language, 'heroTitle')}
                  {heroSliders[currentSlide].subtitle ? (
                    <span className="block mt-2 text-[#ff6b35] drop-shadow-md">
                      {heroSliders[currentSlide].subtitle}
                    </span>
                  ) : (
                    <span className="block mt-2 text-[#ff6b35] drop-shadow-md">
                      {getTranslation(language, 'heroSubtitle')}
                    </span>
                  )}
                </h2>
              ) : (
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight drop-shadow-lg">
                  {getTranslation(language, 'heroTitle')}
                  <span className="block mt-2 text-[#ff6b35] drop-shadow-md">
                    {getTranslation(language, 'heroSubtitle')}
                  </span>
                </h2>
              )}
            
              <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <button 
                  onClick={() => router.push('/products')}
                  className="bg-[#004e6c] dark:bg-[#006b8f] text-white px-10 py-4 rounded-2xl text-lg font-bold hover:bg-[#ff6b35] dark:hover:bg-[#ff8555] transition-all duration-300 shadow-2xl hover:shadow-[#ff6b35]/50 transform hover:-translate-y-1"
                >
                  {getTranslation(language, 'viewAllContent')}
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (sessionStorage.getItem('oauth_flow_started')) {
                      sessionStorage.removeItem('oauth_flow_started')
                      sessionStorage.removeItem('oauth_flow_timestamp')
                    }
                    
                    const token = localStorage.getItem('token')
                    const storedUser = localStorage.getItem('user')
                    
                    if (token && storedUser) {
                      try {
                        const user = JSON.parse(storedUser)
                        if (!user.termsAccepted) {
                          setShowTermsModal(true)
                          return
                        }
                        router.push('/account/journalist')
                        return
                      } catch (e) {
                      }
                    }
                    setShowAuthModal(true)
                  }}
                  className="bg-white dark:bg-gray-800 text-[#004e6c] dark:text-gray-200 border-2 border-[#004e6c] dark:border-gray-600 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-[#004e6c] dark:hover:bg-[#006b8f] hover:text-white hover:border-[#ff6b35] dark:hover:border-[#ff8555] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  {getTranslation(language, 'addYourContent')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      */}

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
                ₮ 120,116,400
              </div>
              <div className="text-[#004e6c]/60 dark:text-gray-400 font-medium text-sm">
                {getTranslation(language, 'earned')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending / Best Seller Section */}
      {bestSellingProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-br from-orange-50 via-red-50 to-orange-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <span className="text-2xl animate-pulse">🔥</span>
              <h2 className="text-xl md:text-2xl font-bold text-[#004e6c] dark:text-gray-200">
                Trending / Best Seller
              </h2>
              <span className="text-2xl animate-pulse">🔥</span>
            </div>
            <p className="text-lg text-[#004e6c]/70 dark:text-gray-400 max-w-2xl mx-auto">
              Хамгийн их зарагдсан контентууд - бусад хүмүүс юу авч байна вэ?
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {bestSellingProducts.map((product, index) => {
              const isUnique = (product as any).isUnique === true;
              const isNew = isNewProduct(product);
              return (
                <div
                  key={product.id}
                  onClick={() => router.push(`/products/${product.uuid || product.id}`)}
                  className={`group relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${
                    isUnique 
                      ? 'border-2 border-green-400 bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20' 
                      : 'bg-white dark:bg-gray-800 border-2 border-orange-200 dark:border-orange-800/30 hover:border-orange-400 dark:hover:border-orange-600'
                  }`}
                >
                  {/* Trending Badge - Top Left */}
                  <div className="absolute top-2 left-2 z-10">
                    <div className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 text-white px-2 py-1 rounded-full shadow-lg flex items-center space-x-1 animate-pulse">
                      <span className="text-xs">🔥</span>
                      <span className="text-[10px] font-bold">#{index + 1}</span>
                    </div>
                  </div>

                  {/* Product Image */}
                  <div className="relative h-32 overflow-hidden bg-gradient-to-br from-orange-100 dark:from-gray-700 to-red-100 dark:to-gray-600">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* New Badge - Top Right */}
                    {isNew && (
                      <div className="absolute top-2 right-2 z-10">
                        <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 text-white px-1.5 py-0.5 rounded-full shadow-lg text-[10px] font-bold animate-pulse">
                          ШИНЭ
                        </div>
                      </div>
                    )}
                    
                    {/* Unique Badge - Below New Badge if both exist */}
                    {isUnique && (
                      <div className={`absolute ${isNew ? 'top-8' : 'top-2'} right-2 z-10`}>
                        <div className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white px-1.5 py-0.5 rounded-full shadow-lg text-[10px] font-bold">
                          UNIQUE
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-2.5">
                    <h3 className="text-xs font-bold text-[#004e6c] dark:text-gray-200 mb-1.5 line-clamp-2 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors min-h-[2rem]">
                      {product.title}
                    </h3>
                    
                    {/* Purchase Count - Prominent */}
                    <div className="flex items-center space-x-1 mb-2 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md">
                      <span className="text-orange-600 dark:text-orange-400 font-bold text-xs">🛒</span>
                      <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300">
                        {product.downloads || 0} худалдан авалт
                      </span>
                    </div>

                    {/* Price and Rating */}
                    <div className="flex items-center justify-between pt-2 border-t border-orange-200 dark:border-orange-800/30">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#ff6b35] dark:text-[#ff8555]">
                          {product.price.toLocaleString()}₮
                        </span>
                        <div className="flex items-center space-x-0.5 mt-0.5">
                          <span className="text-yellow-400 text-[10px]">⭐</span>
                          <span className="text-[10px] font-semibold text-[#004e6c]/70 dark:text-gray-400">
                            {product.rating || 0}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/products/${product.uuid || product.id}`)
                        }}
                        className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
                        aria-label={getTranslation(language, 'details')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
 {/* Top Journalists Section */}
 {topBloggers.length > 0 && (
        <section className="bg-gray-200 dark:bg-gray-800 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#004e6c] dark:text-gray-200 mb-4">
                {getTranslation(language, 'topJournalists')}
              </h2>
              <p className="text-lg text-[#004e6c]/70 dark:text-gray-400 max-w-2xl mx-auto">
                {getTranslation(language, 'topJournalistsDescription')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {topBloggers.slice(0, 12).map((journalist: any) => {
                const getAvatarUrl = () => {
                  if (journalist.avatar) return journalist.avatar
                  const seed = journalist.name || journalist.username || journalist.userId || 'default'
                  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`
                }
                
                // Get membership name for badge
                const getMembershipName = () => {
                  const membershipName = journalist.membership?.name || '';
                  if (membershipName) {
                    const upperName = membershipName.toUpperCase();
                    if (upperName.includes('PLATINUM')) return 'PLATINUM';
                    if (upperName.includes('GOLD')) return 'GOLD';
                    if (upperName.includes('SILVER')) return 'SILVER';
                    if (upperName.includes('BRONZE')) return 'BRONZE';
                    if (upperName.includes('FREE')) return 'FREE';
                    return membershipName.toUpperCase();
                  }
                  return 'FREE';
                };

                // Get membership badge color
                const getMembershipBadgeColor = (name: string) => {
                  const upperName = name.toUpperCase();
                  if (upperName.includes('PLATINUM')) return 'bg-cyan-500 text-white';
                  if (upperName.includes('GOLD')) return 'bg-yellow-500 text-white';
                  if (upperName.includes('SILVER')) return 'bg-slate-500 text-white';
                  if (upperName.includes('BRONZE')) return 'bg-orange-600 text-white';
                  return 'bg-gray-500 text-white';
                };

                const membershipName = getMembershipName();
                const badgeColor = getMembershipBadgeColor(membershipName);
                
                return (
                  <div
                    key={journalist.userId || journalist.id}
                    onClick={() => router.push(`/journalist/${journalist.userId || journalist.id}`)}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border-2 border-[#004e6c]/10 dark:border-gray-700 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 transition-all transform hover:-translate-y-1 hover:shadow-xl cursor-pointer group"
                  >
                    <div className="p-4 text-center">
                      <div className="relative inline-block mb-3">
                        <img
                          src={getAvatarUrl()}
                          alt={journalist.name || journalist.username || 'Journalist'}
                          className="w-16 h-16 rounded-full border-2 border-[#004e6c] dark:border-[#006b8f] shadow-md group-hover:border-[#ff6b35] dark:group-hover:border-[#ff8555] transition-colors"
                          onError={(e) => {
                            const seed = journalist.name || journalist.username || journalist.userId || 'default'
                            ;(e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`
                          }}
                        />
                        {/* Membership Badge in corner */}
                        <div className={`absolute -bottom-1 -right-1 ${badgeColor} text-[8px] font-bold px-1 py-0.5 rounded-full shadow-md border-2 border-white dark:border-gray-800 z-20 uppercase`}>
                          {membershipName}
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-[#004e6c] dark:text-gray-200 mb-1 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors line-clamp-1">
                        {journalist.name || journalist.username || 'Unknown'}
                      </h3>
                      {journalist.username && (
                        <p className="text-xs text-[#004e6c]/60 dark:text-gray-400 mb-2 line-clamp-1">
                          {journalist.username.startsWith('@') ? journalist.username : `@${journalist.username}`}
                        </p>
                      )}
                      
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center justify-center space-x-1.5">
                          <span className="text-yellow-400 text-xs">⭐</span>
                          <span className="text-xs font-semibold text-[#004e6c] dark:text-gray-200">
                            {typeof journalist.rating === 'number' ? journalist.rating.toFixed(1) : parseFloat(journalist.rating ?? 0).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-xs text-[#004e6c]/70 dark:text-gray-400">
                          <span className="flex items-center space-x-0.5">
                            <span>👥</span>
                            <span>
                              {(() => {
                                const followers = typeof journalist.followers === 'number' ? journalist.followers : (parseInt(journalist.followers) || 0)
                                if (followers >= 1000) {
                                  return (followers / 1000).toFixed(1) + 'K'
                                }
                                return followers.toLocaleString()
                              })()}
                            </span>
                          </span>
                          <span className="flex items-center space-x-0.5">
                            <span>📝</span>
                            <span>{journalist.posts ?? 0}</span>
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/journalist/${journalist.userId || journalist.id}`)
                        }}
                        className="w-full bg-[#004e6c] dark:bg-[#006b8f] text-white py-1.5 rounded-lg text-xs font-semibold hover:bg-[#ff6b35] dark:hover:bg-[#ff8555] transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        {getTranslation(language, 'viewProfile')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}
      {/* Features Section */}
      <section className="relative w-full py-12 overflow-hidden bg-white">
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
          <h2 className="text-3xl md:text-3xl lg:text-4xl font-bold text-white dark:text-gray-200 mb-6">
            {getTranslation(language, 'whyTitle')}
          </h2>
          <p className="text-xl md:text-1xl text-white/90 dark:text-gray-300 mb-10 max-w-1xl mx-auto font-medium">
            {getTranslation(language, 'whyDescription')}
          </p>

          {isJournalist ? (
            <button 
              onClick={() => router.push('/account/journalist')}
              className="bg-[#ff6b35] dark:bg-[#ff8555] text-white px-12 py-5 rounded-2xl text-lg font-bold hover:bg-[#ff8555] dark:hover:bg-[#ff6b35] transition-all shadow-2xl hover:shadow-[#ff6b35]/50 transform hover:-translate-y-1"
            >
              {getTranslation(language, 'joinForFree')}
            </button>
          ) : (
            <>
              <button 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  // Clear any stale OAuth flags before opening modal
                  if (sessionStorage.getItem('oauth_flow_started')) {
                    sessionStorage.removeItem('oauth_flow_started')
                    sessionStorage.removeItem('oauth_flow_timestamp')
                  }
                  
                  // Check if user is authenticated
                  const token = localStorage.getItem('token')
                  const storedUser = localStorage.getItem('user')
                  
                  if (token && storedUser) {
                    try {
                      const user = JSON.parse(storedUser)
                      // Check if user has accepted terms
                      if (!user.termsAccepted) {
                        // User is authenticated but hasn't accepted terms - show terms modal
                        setShowTermsModal(true)
                        return
                      }
                      // User is authenticated and has accepted terms - navigate to journalist page
                      router.push('/account/journalist')
                      return
                    } catch (e) {
                      // If parsing fails, continue to show auth modal
                    }
                  }
                  
                  // If not authenticated, show auth modal
                  setShowAuthModal(true)
                }}
                className="bg-[#ff6b35] dark:bg-[#ff8555] text-white px-12 py-5 rounded-2xl text-lg font-bold hover:bg-[#ff8555] dark:hover:bg-[#ff6b35] transition-all shadow-2xl hover:shadow-[#ff6b35]/50 transform hover:-translate-y-1"
              >
                {getTranslation(language, 'joinForFree')}
              </button>
              <AuthModal
                isOpen={showAuthModal}
                onClose={() => {
                  setShowAuthModal(false)
                  // Clear OAuth flag when modal is closed
                  if (sessionStorage.getItem('oauth_flow_started')) {
                    sessionStorage.removeItem('oauth_flow_started')
                    sessionStorage.removeItem('oauth_flow_timestamp')
                  }
                }}
                onSelectGoogle={() => {
                  setShowAuthModal(false)
                }}
                onSelectFacebook={() => {
                  setShowAuthModal(false)
                }}
              />
            </>
          )}
        </div>
      </section>

      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => {
          setShowTermsModal(false)
        }}
        onAccept={() => {
          setShowTermsModal(false)
          // Refresh user data and update isJournalist state
          const storedUser = localStorage.getItem('user')
          const token = localStorage.getItem('token')
          if (storedUser && token) {
            try {
              const user = JSON.parse(storedUser)
              // Update isJournalist state
              setIsJournalist(user.role === 'journalist' && user.termsAccepted === true)
              // If user is journalist and has accepted terms, redirect to journalist page
              if (user.role === 'journalist' && user.termsAccepted) {
                router.push('/account/journalist')
              }
            } catch (e) {
              // If parsing fails, do nothing
            }
          }
        }}
        showAcceptButton={true}
      />

      {/* Featured Products Section */}
      <section className="bg-gray-200 dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {displayedProducts.map((product) => {
            const isUnique = (product as any).isUnique === true;
            const isNew = isNewProduct(product);
            return (
              <div
                key={product.id}
                className={`rounded-xl transition-all duration-300 transform hover:-translate-y-2 ${
                  isUnique 
                    ? 'p-0.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 shadow-md hover:shadow-lg' 
                    : ''
                }`}
              >
                <div
                  onClick={() => router.push(`/products/${product.uuid || product.id}`)}
                  className={`rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer ${
                    isUnique 
                      ? 'bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20' 
                      : 'border-2 border-[#004e6c]/10 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#004e6c]/30 dark:hover:border-gray-600'
                  }`}
                  style={isUnique ? {
                    boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.2), 0 10px 10px -5px rgba(34, 197, 94, 0.05)'
                  } : {}}
                >
                  {/* Product Image */}
                  <div className={`relative h-36 overflow-hidden ${
                    isUnique 
                      ? 'bg-gradient-to-br from-green-50 dark:from-green-900/20 to-emerald-50 dark:to-emerald-900/20' 
                      : 'bg-gradient-to-br from-[#004e6c]/10 dark:from-gray-700/20 to-[#006b8f]/10 dark:to-gray-600/20'
                  }`}>
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
                    
                    {/* New Badge - Top Left */}
                    {isNew && (
                      <div className="absolute top-2 left-2 z-10">
                        <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 text-white px-2 py-0.5 rounded-full shadow-md flex items-center space-x-0.5 animate-pulse">
                          <span className="text-[10px]">✨</span>
                          <span className="text-[10px] font-bold">ШИНЭ</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Unique Badge - Below New Badge if both exist, otherwise top left */}
                    {isUnique && (
                      <div className={`absolute ${isNew ? 'top-8 left-2' : 'top-2 left-2'} z-10`}>
                        <div className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white px-2 py-0.5 rounded-full shadow-md flex items-center space-x-0.5 animate-pulse">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-[10px] font-bold">UNIQUE</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Star Rating and Wishlist Icon - positioned together on the right */}
                    <div className={`absolute ${(isUnique || isNew) ? 'top-8 right-2' : 'top-2 right-2'} flex items-center space-x-1.5`}>
                      {/* Wishlist Heart Icon */}
                      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-1.5 rounded-full shadow-md">
                        <WishlistHeartIcon 
                          productId={product.uuid || product.id} 
                          size="sm"
                        />
                      </div>
                      {/* Star Rating */}
                      <div className="flex items-center space-x-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-2 py-1 rounded-full shadow-md">
                        <span className="text-yellow-400 text-xs">⭐</span>
                        <span className="text-[10px] font-bold text-[#004e6c] dark:text-gray-200">
                          {product.rating}
                        </span>
                      </div>
                    </div>
                    {/* Category Badge - positioned at bottom left */}
                    <div className={`absolute ${(isUnique || isNew) ? 'top-8 left-2' : 'bottom-2 left-2'}`}>
                      <span className="text-[10px] font-bold text-white bg-[#004e6c] dark:bg-[#006b8f] px-2 py-1 rounded-full shadow-md group-hover:bg-[#ff6b35] dark:group-hover:bg-[#ff8555] transition-colors">
                        {typeof product.category === 'object' && product.category?.name
                          ? product.category.name
                          : typeof product.category === 'string'
                          ? product.category
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className={`text-sm font-bold mb-2 line-clamp-2 transition-colors min-h-[2.5rem] ${
                      isUnique 
                        ? 'text-green-900 dark:text-green-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400' 
                        : 'text-[#004e6c] dark:text-gray-200 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555]'
                    }`}>
                      {product.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-[#004e6c]/70 dark:text-gray-400 mb-3 font-medium">
                      <span className="flex items-center space-x-1">
                        <span>📄</span>
                        <span>{product.pages ? `${product.pages} ${getTranslation(language, 'pages')}` : product.size}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>⬇️</span>
                        <span>{product.downloads}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t-2 border-[#004e6c]/10 dark:border-gray-700 gap-2">
                      <span className={`text-lg font-bold transition-colors ${
                        isUnique 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-[#004e6c] dark:text-gray-200 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555]'
                      }`}>
                        {product.price.toLocaleString()}₮
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/products/${product.id}`)
                        }}
                        className={`w-8 h-8 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center group ${
                          isUnique
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                            : 'bg-[#004e6c] dark:bg-[#006b8f] text-white hover:bg-[#ff6b35] dark:hover:bg-[#ff8555]'
                        }`}
                        aria-label={getTranslation(language, 'details')}
                      >
                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
        </div>
      </section>

     

      {/* Membership Section */}
      {memberships.length > 0 && (
        <section className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#004e6c] dark:text-gray-200 mb-4">
                {getTranslation(language, 'membershipPlans') || 'Membership Plans'}
              </h2>
              <p className="text-xl text-[#004e6c]/70 dark:text-gray-400 max-w-3xl mx-auto">
                {getTranslation(language, 'chooseMembershipPlan') || 'Choose the perfect membership plan for your needs'}
              </p>
            </div>

            {/* Subscription Value Proposition Section */}
            <div className="bg-gradient-to-r from-[#004e6c] to-[#ff6b35] dark:from-[#006b8f] dark:to-[#ff8555] rounded-3xl shadow-2xl p-8 md:p-12 mb-16 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -ml-48 -mb-48"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <h3 className="text-3xl md:text-4xl font-bold mb-4">
                    Subscription-ийн үнэ цэнэ
                  </h3>
                  <p className="text-xl opacity-90 max-w-2xl mx-auto">
                    Нэг удаагийн худалдааны оронд subscription авах нь илүү хэмнэлттэй, тохиромжтой
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Advantages */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <div className="text-4xl mb-4">🎯</div>
                    <h4 className="text-xl font-bold mb-3">Ямар давуу талтай вэ?</h4>
                    <ul className="space-y-2 text-sm opacity-90">
                      <li className="flex items-start gap-2">
                        <span className="font-bold">✓</span>
                        <span>Хязгааргүй нийтлэх боломж</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">✓</span>
                        <span>Өндөр комиссын хувь</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">✓</span>
                        <span>Онцгой тэмдэглэгээ</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">✓</span>
                        <span>Тогтмол орлого олох</span>
                      </li>
                    </ul>
                  </div>

                  {/* Opportunities */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <div className="text-4xl mb-4">🚀</div>
                    <h4 className="text-xl font-bold mb-3">Ямар боломж нээгдэх вэ?</h4>
                    <ul className="space-y-2 text-sm opacity-90">
                      <li className="flex items-start gap-2">
                        <span className="font-bold">✓</span>
                        <span>Илүү олон бүтээгдэхүүн борлуулах</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">✓</span>
                        <span>Илүү их орлого олох</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">✓</span>
                        <span>Брендээ бэхжүүлэх</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">✓</span>
                        <span>Тогтвортой бизнес хөгжүүлэх</span>
                      </li>
                    </ul>
                  </div>

                  {/* Savings Calculator */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <div className="text-4xl mb-4">💰</div>
                    <h4 className="text-xl font-bold mb-3">Хэмнэлтийн тооцоо</h4>
                    <div className="space-y-3 text-sm">
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="opacity-75 mb-1">Нэг удаагийн худалдаа:</div>
                        <div className="text-lg font-bold">~50,000₮</div>
                        <div className="text-xs opacity-75 mt-1">(жишээ: 10 бүтээгдэхүүн)</div>
                      </div>
                      <div className="bg-white/20 rounded-lg p-3 border-2 border-white/30">
                        <div className="opacity-90 mb-1">Subscription:</div>
                        <div className="text-2xl font-bold">~30,000₮</div>
                        <div className="text-xs opacity-90 mt-1 font-semibold">40% хэмнэлт! 🎉</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="text-center">
                  <button
                    onClick={() => {
                      const paidMembership = memberships.find((m: any) => {
                        const price = typeof m.price === 'number' ? m.price : parseFloat(String(m.price))
                        return price > 0
                      })
                      if (paidMembership) {
                        handleMembershipSelect(paidMembership)
                      }
                    }}
                    disabled={isCreatingInvoice}
                    className="bg-white text-[#004e6c] dark:text-[#006b8f] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 dark:hover:bg-gray-200 transition-all shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingInvoice ? 'Төлбөрийн хуудас үүсгэж байна...' : 'Subscription авах'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Membership Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {memberships.map((membership) => {
                const isFree = typeof membership.price === 'number' ? membership.price === 0 : parseFloat(String(membership.price)) === 0
                const formatPrice = (price: number | string) => {
                  const numPrice = typeof price === 'number' ? price : parseFloat(String(price))
                  if (numPrice === 0) return 'Үнэгүй'
                  return new Intl.NumberFormat('mn-MN').format(numPrice) + '₮'
                }
                
                return (
                  <div
                    key={membership.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border-2 border-[#004e6c]/10 dark:border-gray-700 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 transition-all transform hover:-translate-y-2 hover:shadow-2xl"
                  >
                    <div className={`p-6 relative overflow-hidden ${
                      isFree 
                        ? 'bg-gradient-to-br from-gray-100 dark:from-gray-700 to-gray-200 dark:to-gray-600 text-[#004e6c] dark:text-gray-200' 
                        : 'bg-gradient-to-br from-[#004e6c] to-[#ff6b35] dark:from-[#006b8f] dark:to-[#ff8555] text-white'
                    }`}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                      <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2">{membership.name}</h3>
                        <div className="text-3xl font-bold mb-2">
                          {formatPrice(membership.price)}
                        </div>
                        {!isFree && (
                          <div className="text-sm opacity-90">/ сар</div>
                        )}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#004e6c]/70 dark:text-gray-400 font-medium">Нийтлэх хязгаар:</span>
                          <span className="font-bold text-[#004e6c] dark:text-gray-200">
                            {membership.maxPosts === 0 ? 'Хязгааргүй' : membership.maxPosts}
                          </span>
                        </div>
                        {membership.description && (
                          <p className="text-sm text-[#004e6c]/60 dark:text-gray-400 mt-2 font-medium">
                            {membership.description}
                          </p>
                        )}
                      </div>

                      {membership.advantages && Array.isArray(membership.advantages) && membership.advantages.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-[#004e6c] dark:text-gray-200 mb-2">Давуу талууд:</h4>
                          <ul className="space-y-1">
                            {membership.advantages.map((advantage: string, idx: number) => (
                              <li key={idx} className="text-sm text-[#004e6c]/70 dark:text-gray-400 flex items-start gap-2 font-medium">
                                <span className="text-[#ff6b35] dark:text-[#ff8555] font-bold">✓</span>
                                <span>{advantage}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!isFree && (
                        <button
                          onClick={() => handleMembershipSelect(membership)}
                          disabled={isCreatingInvoice}
                          className={`w-full py-3 rounded-xl font-semibold transition-all shadow-lg ${
                            isCreatingInvoice
                              ? 'bg-[#004e6c]/50 dark:bg-[#006b8f]/50 text-white cursor-wait'
                              : 'bg-[#004e6c] dark:bg-[#006b8f] text-white hover:bg-[#ff6b35] dark:hover:bg-[#ff8555] hover:shadow-xl transform hover:-translate-y-0.5'
                          }`}
                        >
                          {isCreatingInvoice ? 'Төлбөрийн хуудас үүсгэж байна...' : 'Subscription авах'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border-2 border-[#004e6c]/10 dark:border-gray-700">
            <div className="p-6 border-b-2 border-[#004e6c]/10 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#004e6c] dark:text-gray-200">QPay төлбөр</h2>
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setQrCode(null)
                    setQrText(null)
                    setInvoiceId(null)
                    setPaymentStatus(null)
                    setPaymentError(null)
                    if (paymentPollingInterval.current) {
                      clearInterval(paymentPollingInterval.current)
                      paymentPollingInterval.current = null
                    }
                  }}
                  className="text-[#004e6c]/60 dark:text-gray-400 hover:text-[#ff6b35] dark:hover:text-[#ff8555] transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {paymentError && (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                  <p className="text-red-800 dark:text-red-300 font-medium">{paymentError}</p>
                </div>
              )}

              {paymentStatus === 'completed' ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-[#ff6b35] dark:text-[#ff8555] mb-2">
                    Төлбөр амжилттай төлөгдлөө!
                  </h3>
                  <p className="text-[#004e6c]/70 dark:text-gray-400 font-medium">
                    Гишүүнчлэл амжилттай шинэчлэгдлээ.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[#004e6c]/70 dark:text-gray-400 font-medium mb-4">
                    QPay апп ашиглан QR кодыг уншуулж төлбөрөө төлөөрэй.
                  </p>

                  {qrCode ? (
                    <div className="flex flex-col items-center mb-4">
                      <img
                        src={qrCode}
                        alt="QPay QR Code"
                        className="w-64 h-64 border-2 border-[#004e6c]/20 dark:border-gray-600 rounded-xl mb-4"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {qrText && (
                        <p className="text-sm text-[#004e6c]/70 dark:text-gray-400 break-all text-center font-medium">{qrText}</p>
                      )}
                      <div className="flex items-center justify-center space-x-2 text-sm text-[#ff6b35] dark:text-[#ff8555] mt-4">
                        <div className="w-2 h-2 bg-[#ff6b35] dark:bg-[#ff8555] rounded-full animate-pulse"></div>
                        <span className="font-medium">Төлбөрийн статус шалгаж байна...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-[#004e6c]/5 dark:from-[#004e6c]/10 via-white dark:via-gray-800 to-[#ff6b35]/5 dark:to-[#ff6b35]/10 rounded-xl p-8 mb-4 text-center border-2 border-[#004e6c]/10 dark:border-gray-700">
                      <div className="w-12 h-12 border-4 border-[#004e6c] dark:border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-[#004e6c]/70 dark:text-gray-400 font-medium">QR код үүсгэж байна...</p>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-[#004e6c]/5 dark:from-[#004e6c]/10 via-white dark:via-gray-800 to-[#ff6b35]/5 dark:to-[#ff6b35]/10 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-xl p-4">
                    <p className="text-sm text-[#004e6c]/80 dark:text-gray-300 font-medium">
                      Төлбөр төлөгдсөний дараа автоматаар шинэчлэгдэнэ. Хэсэг хугацааны дараа хуудас шинэчлэх шаардлагагүй.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trust & Authority Block */}
      <section className="bg-gradient-to-br from-[#004e6c] via-[#006b8f] to-[#004e6c] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-20 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#ff6b35] rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Tbarimt - Албан ёсны, найдвартай систем
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Монгол улсын төрийн, бизнесийн байгууллагуудын сонголт
            </p>
          </div>

          {/* Trust Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Official System */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2 shadow-xl">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Албан ёсны систем
                </h3>
                <p className="text-white/80 leading-relaxed">
                  Бүртгэлтэй, хууль ёсны байгууллага. Бүх үйл ажиллагаа нь хууль тогтоомжид нийцсэн.
                </p>
              </div>
            </div>

            {/* Government & Business Usage */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2 shadow-xl">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Төрийн, бизнесийн хэрэглээ
                </h3>
                <p className="text-white/80 leading-relaxed">
                  Төрийн байгууллагууд болон томоохон компаниудын итгэл хүлээсэн платформ.
                </p>
              </div>
            </div>

            {/* QPay Secure Payment */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2 shadow-xl">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  QPay, аюулгүй төлбөр
                </h3>
                <p className="text-white/80 leading-relaxed">
                  Монгол улсын хамгийн найдвартай төлбөрийн систем QPay-аар аюулгүй, хурдан төлбөр төлөх.
                </p>
              </div>
            </div>

            {/* Legal & Tax Standards */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2 shadow-xl">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Хууль, татварын стандарт
                </h3>
                <p className="text-white/80 leading-relaxed">
                  Бүх гүйлгээ нь хууль ёсны, татварын хуультай нийцсэн. Баримт бичиг автоматаар гаргана.
                </p>
              </div>
            </div>
          </div>

          {/* Trust Badge / Certification */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center space-x-4 bg-white/10 backdrop-blur-md rounded-full px-8 py-4 border border-white/20">
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-semibold text-lg">Бүртгэлтэй байгууллага</span>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-semibold text-lg">Хууль ёсны үйл ажиллагаа</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Сүүлд нэмэгдсэн контент Section - Right above Footer */}
      {recentProducts.length >= 1 && (
        <section className="bg-white dark:bg-gray-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl md:text-2xl font-medium text-[#004e6c] dark:text-gray-200">
                  Сүүлд нэмэгдсэн контент
                </h3>
                <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 text-white px-3 py-1 rounded-full shadow-lg flex items-center space-x-1">
                  <span className="text-xs">✨</span>
                  <span className="text-xs font-bold">ШИНЭ</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {recentProducts.map((product) => {
                return (
                  <div
                    key={product.id}
                    className="rounded-2xl transition-all duration-300 transform hover:-translate-y-3 border-2 border-[#004e6c]/10 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#004e6c]/30 dark:hover:border-gray-600"
                  >
                    <div
                      onClick={() => router.push(`/products/${product.uuid || product.id}`)}
                      className="rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer"
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
                        
                        {/* New Badge - Top Left */}
                        <div className="absolute top-3 left-3 z-10">
                          <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 text-white px-3 py-1 rounded-full shadow-lg flex items-center space-x-1 animate-pulse">
                            <span className="text-xs">✨</span>
                            <span className="text-xs font-bold">ШИНЭ</span>
                          </div>
                        </div>
                        
                        {/* Star Rating and Wishlist Icon */}
                        <div className="absolute top-12 right-4 flex items-center space-x-2">
                          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-2 rounded-full shadow-lg">
                            <WishlistHeartIcon 
                              productId={product.uuid || product.id} 
                              size="md"
                            />
                          </div>
                          <div className="flex items-center space-x-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                            <span className="text-yellow-400 text-sm">⭐</span>
                            <span className="text-xs font-bold text-[#004e6c] dark:text-gray-200">
                              {product.rating}
                            </span>
                          </div>
                        </div>
                        {/* Category Badge */}
                        <div className="absolute top-12 left-4">
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
                        <h4 className="text-lg font-bold mb-4 line-clamp-2 transition-colors min-h-[3.5rem] text-[#004e6c] dark:text-gray-200 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555]">
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
                          <span className="text-2xl font-bold transition-colors text-[#004e6c] dark:text-gray-200 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555]">
                            {product.price.toLocaleString()}₮
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/products/${product.uuid || product.id}`)
                            }}
                            className="w-10 h-10 rounded-xl bg-[#004e6c] dark:bg-[#006b8f] text-white hover:bg-[#ff6b35] dark:hover:bg-[#ff8555] transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center group"
                            aria-label={getTranslation(language, 'details')}
                          >
                            <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Auth Modal - Always available for subscription buttons */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false)
          // Clear OAuth flag when modal is closed
          if (sessionStorage.getItem('oauth_flow_started')) {
            sessionStorage.removeItem('oauth_flow_started')
            sessionStorage.removeItem('oauth_flow_timestamp')
          }
        }}
        onSelectGoogle={() => {
          setShowAuthModal(false)
        }}
        onSelectFacebook={() => {
          setShowAuthModal(false)
        }}
      />

      <Footer />
    </main>
  )
}
