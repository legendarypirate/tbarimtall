'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDarkMode } from '@/hooks/useDarkMode'
import { getWishlist, removeFromWishlist } from '@/lib/api'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WishlistHeartIcon from '@/components/WishlistHeartIcon'

type Product = {
  id: number | string
  uuid?: string
  title: string
  category: { id: number; name: string; icon?: string } | string
  price: number
  pages?: number
  size?: string
  downloads: number
  rating: number
  image: string
  author?: {
    id: number
    username: string
    fullName?: string
    avatar?: string
  }
  [key: string]: any
}

export default function WishlistPage() {
  const router = useRouter()
  const { isDark } = useDarkMode()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<{
    total: number
    page: number
    limit: number
    totalPages: number
  } | null>(null)
  const [removingIds, setRemovingIds] = useState<Set<number | string>>(new Set())

  useEffect(() => {
    const checkAuth = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      setIsAuthenticated(!!token)
      if (!token) {
        setLoading(false)
        setError('Нэвтрэх шаардлагатай')
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist()
    }
  }, [isAuthenticated, currentPage])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getWishlist({ page: currentPage, limit: 20 })
      console.log('Wishlist API response:', response) // Debug log
      if (response && response.products) {
        setProducts(Array.isArray(response.products) ? response.products : [])
        if (response.pagination) {
          setPagination(response.pagination)
        } else {
          // Set default pagination if not provided
          setPagination({
            total: response.products.length,
            page: currentPage,
            limit: 20,
            totalPages: Math.ceil(response.products.length / 20)
          })
        }
      } else {
        // Handle case where response doesn't have products array
        setProducts([])
        setPagination({
          total: 0,
          page: currentPage,
          limit: 20,
          totalPages: 0
        })
      }
    } catch (error: any) {
      console.error('Error fetching wishlist:', error)
      setError(error.message || 'Хүслийн жагсаалт ачааллахад алдаа гарлаа')
      setProducts([])
      if (error.message?.includes('Authentication') || error.message?.includes('401')) {
        setIsAuthenticated(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromWishlist = async (productId: number | string) => {
    // Prevent multiple clicks
    if (removingIds.has(productId)) {
      return
    }

    setRemovingIds(prev => new Set(prev).add(productId))
    try {
      await removeFromWishlist(productId)
      // Remove from local state
      setProducts(products.filter(p => p.id !== productId))
      // Update pagination
      if (pagination) {
        setPagination({
          ...pagination,
          total: pagination.total - 1
        })
      }
    } catch (error: any) {
      console.error('Error removing from wishlist:', error)
      alert(error.message || 'Хүслийн жагсаалтаас хасахад алдаа гарлаа')
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString('mn-MN')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#004e6c] dark:border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-[#004e6c] dark:text-gray-200 text-lg font-medium">Ачааллаж байна...</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-6">🔒</div>
            <h2 className="text-3xl font-bold text-[#004e6c] dark:text-gray-200 mb-4">
              Нэвтрэх шаардлагатай
            </h2>
            <p className="text-[#004e6c]/70 dark:text-gray-400 mb-8 font-medium">
              Хүслийн жагсаалтыг харахын тулд эхлээд нэвтэрнэ үү
            </p>
            <button
              onClick={() => router.push('/account/login')}
              className="bg-[#004e6c] dark:bg-[#006b8f] text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-[#ff6b35] dark:hover:bg-[#ff8555] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Нэвтрэх
            </button>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#004e6c] dark:text-gray-200 mb-2">
              Хүслийн жагсаалт
            </h1>
            <p className="text-[#004e6c]/70 dark:text-gray-400 font-medium">
              {pagination?.total || products.length} бүтээгдэхүүн
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {products.length === 0 && !loading ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">❤️</div>
            <h3 className="text-2xl font-bold text-[#004e6c] dark:text-gray-200 mb-2">
              Хүслийн жагсаалт хоосон байна
            </h3>
            <p className="text-[#004e6c]/70 dark:text-gray-400 mb-8 font-medium">
              Сонирхсон бүтээгдэхүүнээ хүслийн жагсаалтад нэмээрэй
            </p>
            <button
              onClick={() => router.push('/products')}
              className="bg-[#004e6c] dark:bg-[#006b8f] text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-[#ff6b35] dark:hover:bg-[#ff8555] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Бүтээгдэхүүн харах
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
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
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#004e6c]/20 dark:from-gray-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-16 right-4 flex items-center space-x-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                      <span className="text-yellow-400 text-sm">⭐</span>
                      <span className="text-xs font-bold text-[#004e6c] dark:text-gray-200">
                        {product.rating || 0}
                      </span>
                    </div>
                    {/* Wishlist Heart Icon */}
                    <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-2 rounded-full shadow-lg">
                      <WishlistHeartIcon 
                        productId={product.uuid || product.id} 
                        size="md"
                        onToggle={(isInWishlist) => {
                          if (!isInWishlist) {
                            handleRemoveFromWishlist(product.id)
                          }
                        }}
                      />
                    </div>
                    {/* Delete Icon */}
                    <div 
                      className="absolute top-4 right-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer z-10"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFromWishlist(product.id)
                      }}
                      title="Хүслийн жагсаалтаас хасах"
                    >
                      {removingIds.has(product.id) ? (
                        <svg className="w-5 h-5 animate-spin text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </div>
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
                        <span>{product.pages ? `${product.pages} хуудас` : product.size}</span>
                      </span>
                      <span className="flex items-center space-x-2">
                        <span>⬇️</span>
                        <span>{formatNumber(product.downloads || 0)}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-5 border-t-2 border-[#004e6c]/10 dark:border-gray-700 gap-3">
                      <span className="text-2xl font-extrabold text-[#004e6c] dark:text-gray-200 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
                        {formatNumber(parseFloat(product.price?.toString() || '0'))}₮
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/products/${product.uuid || product.id}`)
                        }}
                        className="bg-[#004e6c] dark:bg-[#006b8f] text-white w-10 h-10 rounded-xl hover:bg-[#ff6b35] dark:hover:bg-[#ff8555] transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center group"
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

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-12">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-[#004e6c]/20 dark:border-gray-700 rounded-lg text-[#004e6c] dark:text-gray-200 font-semibold hover:bg-[#004e6c] hover:text-white dark:hover:bg-[#006b8f] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Өмнөх
                </button>
                <span className="px-4 py-2 text-[#004e6c] dark:text-gray-200 font-semibold">
                  {currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-[#004e6c]/20 dark:border-gray-700 rounded-lg text-[#004e6c] dark:text-gray-200 font-semibold hover:bg-[#004e6c] hover:text-white dark:hover:bg-[#006b8f] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Дараах
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </main>
  )
}

