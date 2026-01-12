'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDarkMode } from '@/hooks/useDarkMode'
import { searchProducts } from '@/lib/api'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WishlistHeartIcon from '@/components/WishlistHeartIcon'

export const dynamic = 'force-dynamic'

// Default products data (fallback)
const defaultProducts = [
  {
    id: 1,
    title: 'Монгол улсын эдийн засгийн хөгжил',
    category: 'Реферат',
    price: 15000,
    pages: 25,
    downloads: 234,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop',
    createdAt: '2024-01-15'
  },
  {
    id: 2,
    title: 'Компьютерийн сүлжээний аюулгүй байдал',
    category: 'Дипломын ажил',
    price: 45000,
    pages: 80,
    downloads: 156,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop',
    createdAt: '2024-02-10'
  },
  {
    id: 3,
    title: 'Action Adventure Game Pack',
    category: 'Тоглоом (EXE)',
    price: 25000,
    size: '2.5 GB',
    downloads: 892,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=250&fit=crop',
    createdAt: '2024-01-20'
  },
  {
    id: 4,
    title: 'Мэдээллийн системийн дизайн',
    category: 'Курсын ажил',
    price: 20000,
    pages: 35,
    downloads: 178,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
    createdAt: '2024-03-05'
  },
  {
    id: 5,
    title: 'Office Suite Pro 2024',
    category: 'Программ хангамж',
    price: 35000,
    size: '500 MB',
    downloads: 445,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
    createdAt: '2024-02-28'
  },
  {
    id: 6,
    title: 'Монгол хэлний утга зохиол',
    category: 'Реферат',
    price: 12000,
    pages: 20,
    downloads: 312,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop',
    createdAt: '2024-01-10'
  },
  {
    id: 7,
    title: 'Photoshop Template Collection',
    category: 'График дизайн',
    price: 18000,
    size: '150 MB',
    downloads: 567,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=250&fit=crop',
    createdAt: '2024-02-15'
  },
  {
    id: 8,
    title: 'Монголын түүх судлал',
    category: 'Реферат',
    price: 14000,
    pages: 28,
    downloads: 289,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop',
    createdAt: '2024-01-25'
  },
  {
    id: 9,
    title: 'AutoCAD 3D Modeling Tutorial',
    category: 'График дизайн',
    price: 28000,
    pages: 45,
    downloads: 234,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop',
    createdAt: '2024-03-12'
  },
  {
    id: 10,
    title: 'Монголын уламжлалт аялгуу',
    category: 'Дуу Хөгжим',
    price: 16000,
    size: '200 MB',
    downloads: 445,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop',
    createdAt: '2024-02-20'
  },
  {
    id: 11,
    title: 'Бизнес төлөвлөлтийн загвар',
    category: 'Баримт бичиг',
    price: 22000,
    pages: 30,
    downloads: 189,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop',
    createdAt: '2024-03-01'
  },
  {
    id: 12,
    title: 'Puzzle Game Collection',
    category: 'Тоглоом (EXE)',
    price: 19000,
    size: '800 MB',
    downloads: 678,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=250&fit=crop',
    createdAt: '2024-01-30'
  }
]

const sortOptions = [
  { value: 'newest', label: 'Шинэ эхэнд' },
  { value: 'oldest', label: 'Хуучин эхэнд' },
  { value: 'price-low', label: 'Үнэ: Багаас их рүү' },
  { value: 'price-high', label: 'Үнэ: Ихээс бага руу' },
  { value: 'rating', label: 'Үнэлгээ: Өндөр' },
  { value: 'downloads', label: 'Эрэлт: Өндөр' }
]

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isDark } = useDarkMode()
  const queryParam = searchParams.get('q') || ''
  
  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSearchQuery(queryParam)
  }, [queryParam])

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery.trim()) {
        setFilteredProducts([])
        return
      }

      try {
        setLoading(true)
        const response = await searchProducts(searchQuery, { sortBy, limit: 100 })
        if (response.products) {
          setFilteredProducts(response.products)
        }
      } catch (error) {
        console.error('Error searching products:', error)
        setFilteredProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchSearchResults()
  }, [searchQuery, sortBy])

  const formatNumber = (num: number) => {
    return num.toLocaleString('mn-MN')
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#004e6c] via-[#006b8f] to-[#ff6b35] rounded-2xl opacity-20 group-hover:opacity-30 blur transition-opacity duration-300"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-[#004e6c]/20 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] shadow-md">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      router.push('/search?q=')
                    }}
                    className="absolute inset-y-0 right-24 pr-4 flex items-center text-[#004e6c]/60 dark:text-gray-400 hover:text-[#004e6c] dark:hover:text-gray-300 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={handleSearch}
                  className="absolute inset-y-0 right-0 px-6 bg-gradient-to-r from-[#004e6c] to-[#ff6b35] text-white rounded-r-xl hover:from-[#006b8f] hover:to-[#ff8555] transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  Хайх
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          {/* Results Count */}
          <div className="text-sm text-[#004e6c]/70 dark:text-gray-400 font-medium">
            {searchQuery ? (
              <>
                "<span className="font-bold text-[#004e6c] dark:text-gray-200">{searchQuery}</span>" хайлтаар{' '}
                <span className="font-bold text-[#004e6c] dark:text-gray-200">{filteredProducts.length}</span> бүтээгдэхүүн олдлоо
              </>
            ) : (
              <span>Хайлтын үг оруулна уу</span>
            )}
          </div>

          {/* View Mode and Sort */}
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#004e6c] dark:bg-[#006b8f] text-white'
                    : 'text-[#004e6c] dark:text-gray-300 hover:bg-[#004e6c]/10 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#004e6c] dark:bg-[#006b8f] text-white'
                    : 'text-[#004e6c] dark:text-gray-300 hover:bg-[#004e6c]/10 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-xl border-2 border-[#004e6c]/20 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#004e6c] dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#004e6c]/30 dark:focus:ring-[#006b8f]/30 focus:border-[#004e6c] dark:focus:border-[#006b8f] font-medium"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid/List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-[#004e6c] dark:border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-[#004e6c] dark:text-gray-200 text-lg font-medium">Хайж байна...</p>
          </div>
        ) : !searchQuery ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-[#004e6c] dark:text-gray-200 mb-2">
              Хайлтын үг оруулна уу
            </h3>
            <p className="text-[#004e6c]/70 dark:text-gray-400 mb-6 font-medium">
              Дээрх хайлтын талбарт хайх үгээ оруулна уу
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-[#004e6c] dark:bg-[#006b8f] text-white rounded-xl hover:bg-[#ff6b35] dark:hover:bg-[#ff8555] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Нүүр хуудас руу буцах
            </button>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => router.push(`/products/${(product as any).uuid || (product as any).id}`)}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-[#004e6c]/10 dark:border-gray-700 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 group cursor-pointer ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
              >
                {/* Product Image */}
                <div className={`relative overflow-hidden bg-gradient-to-br from-[#004e6c]/10 to-[#006b8f]/10 ${
                  viewMode === 'list' ? 'w-48 h-48 flex-shrink-0' : 'h-48'
                }`}>
                    <img
                      src={(product as any).image || '/placeholder.png'}
                      alt={(product as any).title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  {/* Star Rating and Wishlist Icon - positioned together on the right */}
                  <div className="absolute top-3 right-3 flex items-center space-x-2">
                    {/* Wishlist Heart Icon */}
                    <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-1.5 rounded-full shadow-lg">
                      <WishlistHeartIcon 
                        productId={(product as any).uuid || (product as any).id} 
                        size="sm"
                      />
                    </div>
                    {/* Star Rating */}
                    <div className="flex items-center space-x-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-2 py-1 rounded-full shadow-lg">
                      <span className="text-yellow-400 text-sm">⭐</span>
                      <span className="text-xs font-semibold text-[#004e6c] dark:text-gray-200">
                        {parseFloat((product as any).rating) || 0}
                      </span>
                    </div>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-bold text-white bg-[#004e6c] dark:bg-[#006b8f] px-3 py-1.5 rounded-full shadow-lg group-hover:bg-[#ff6b35] dark:group-hover:bg-[#ff8555] transition-colors">
                      {typeof (product as any).category === 'object' && (product as any).category?.name
                        ? (product as any).category.name
                        : typeof (product as any).category === 'string'
                        ? (product as any).category
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <h4 className="text-lg font-semibold text-[#004e6c] dark:text-gray-200 mb-3 line-clamp-2 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
                    {(product as any).title}
                  </h4>
                  <div className="flex items-center justify-between text-sm text-[#004e6c]/70 dark:text-gray-400 mb-4 font-medium">
                    <span className="flex items-center space-x-1">
                      <span>📄</span>
                      <span>{(product as any).pages ? `${(product as any).pages} хуудас` : (product as any).size || 'N/A'}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>⬇️</span>
                      <span>{formatNumber((product as any).downloads || 0)}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t-2 border-[#004e6c]/10 dark:border-gray-700 gap-3">
                    <span className="text-lg font-bold text-[#004e6c] dark:text-gray-200">
                      {formatNumber(parseFloat((product as any).price) || 0)}₮
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/products/${(product as any).uuid || (product as any).id}`)
                      }}
                      className="bg-gradient-to-r from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] text-white px-3 py-1.5 rounded-xl hover:from-[#ff6b35] hover:to-[#ff8555] dark:hover:from-[#ff8555] dark:hover:to-[#ff6b35] transition-all text-xs font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      Дэлгэрэнгүй
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-[#004e6c] dark:text-gray-200 mb-2">
              Бүтээгдэхүүн олдсонгүй
            </h3>
            <p className="text-[#004e6c]/70 dark:text-gray-400 mb-6 font-medium">
              "<span className="font-bold text-[#004e6c] dark:text-gray-200">{searchQuery}</span>" хайлтаар бүтээгдэхүүн олдсонгүй
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setSearchQuery('')
                  router.push('/search?q=')
                }}
                className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 text-[#004e6c] dark:text-gray-200 rounded-xl hover:bg-[#004e6c]/10 dark:hover:bg-gray-700 hover:border-[#ff6b35]/50 dark:hover:border-[#ff8555]/50 transition-all duration-300 font-semibold"
              >
                Хайлтыг цэвэрлэх
              </button>
              <button
                onClick={() => router.push('/products')}
                className="px-6 py-3 bg-[#004e6c] dark:bg-[#006b8f] text-white rounded-xl hover:bg-[#ff6b35] dark:hover:bg-[#ff8555] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Бүх бүтээгдэхүүн үзэх
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#004e6c] dark:border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-[#004e6c] dark:text-gray-200 text-lg font-medium">Ачааллаж байна...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}

