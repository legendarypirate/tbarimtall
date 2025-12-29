'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getJournalistById } from '@/lib/api'

export const dynamic = 'force-dynamic'

// Default journalist data (fallback)
const defaultJournalistsData: { [key: string]: any } = {
  '1': {
    id: 1,
    name: 'Батбаяр',
    username: '@batbayar_pro',
    email: 'batbayar@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Batbayar',
    specialty: 'Дипломын ажил',
    rating: 4.9,
    followers: 12500,
    following: 234,
    posts: 234,
    totalViews: 125000,
    totalDownloads: 45000,
    totalEarnings: 1250000,
    bio: 'Мэдээллийн технологи, дипломын ажлууд бэлтгэх мэргэжилтэн. 5+ жилийн туршлагатай.',
    joinedDate: '2020-01-15',
    location: 'Улаанбаатар, Монгол улс',
    website: 'https://batbayar.pro',
    verified: true,
    products: [
      {
        id: 1,
        title: 'Монгол улсын эдийн засгийн хөгжил',
        category: 'Реферат',
        price: 15000,
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
        downloads: 156,
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop',
        createdAt: '2024-02-20'
      },
      {
        id: 3,
        title: 'Мэдээллийн системийн дизайн',
        category: 'Курсын ажил',
        price: 20000,
        downloads: 178,
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
        createdAt: '2024-03-10'
      }
    ],
    reviews: [
      {
        id: 1,
        user: 'Сараа',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Saraa',
        rating: 5,
        comment: 'Маш чанартай ажил байсан. Амжилт хүсье!',
        date: '2024-01-20'
      },
      {
        id: 2,
        user: 'Оюунцэцэг',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oyuntsetseg',
        rating: 5,
        comment: 'Хурдан, найдвартай. Маш сайн!',
        date: '2024-02-15'
      }
    ]
  },
  '2': {
    id: 2,
    name: 'Сараа',
    username: '@saraa_writer',
    email: 'saraa@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Saraa',
    specialty: 'Реферат',
    rating: 4.8,
    followers: 8300,
    following: 189,
    posts: 189,
    totalViews: 89000,
    totalDownloads: 32000,
    totalEarnings: 850000,
    bio: 'Боловсрол, соёлын сэдвээр реферат бэлтгэх мэргэжилтэн.',
    joinedDate: '2020-03-20',
    location: 'Улаанбаатар, Монгол улс',
    verified: true,
    products: [
      {
        id: 4,
        title: 'Монгол хэлний утга зохиол',
        category: 'Реферат',
        price: 12000,
        downloads: 312,
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop',
        createdAt: '2024-01-10'
      }
    ],
    reviews: [
      {
        id: 3,
        user: 'Батбаяр',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Batbayar',
        rating: 4,
        comment: 'Сайн ажил байна.',
        date: '2024-01-25'
      }
    ]
  }
}

export default function JournalistProfile() {
  const params = useParams()
  const router = useRouter()
  const journalistId = params?.id as string
  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products')
  const [journalist, setJournalist] = useState<any>(defaultJournalistsData[journalistId] || defaultJournalistsData['1'])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJournalist = async () => {
      try {
        setLoading(true)
        const response = await getJournalistById(journalistId)
        if (response.journalist) {
          setJournalist(response.journalist)
        }
      } catch (error) {
        console.error('Error fetching journalist:', error)
      } finally {
        setLoading(false)
      }
    }

    if (journalistId) {
      fetchJournalist()
    }
  }, [journalistId])

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString('mn-MN')
  }

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

  const user = journalist.user || {}
  const products = journalist.products || []
  const reviews = journalist.reviews || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <span>←</span>
              <span>Буцах</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Нийтлэлчийн профайл
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative">
              <img
                src={user.avatar || '/placeholder.png'}
                alt={user.fullName || user.username || 'Journalist'}
                className="w-32 h-32 rounded-full border-4 border-blue-500 dark:border-blue-400 shadow-lg"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {user.fullName || user.username || 'Unknown'}
                </h2>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                @{user.username || 'unknown'}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {journalist.bio || 'Тайлбар байхгүй байна.'}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                {journalist.specialty && (
                  <span className="flex items-center space-x-1">
                    <span>🎯</span>
                    <span>{journalist.specialty}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <div className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-lg">
                <span className="text-yellow-600 dark:text-yellow-400 text-xl">⭐</span>
                <span className="font-bold text-yellow-700 dark:text-yellow-300">
                  {parseFloat(journalist.rating) || 0}
                </span>
              </div>
              <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md">
                Дагах
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatNumber(journalist.followers || 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Дагагчид</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {journalist.posts || products.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Нийтлэл</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatNumber(products.reduce((sum: number, p: any) => sum + (p.views || 0), 0))}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Нийт үзсэн</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatNumber(products.reduce((sum: number, p: any) => sum + (p.downloads || 0), 0))}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Татсан тоо</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-4 px-6">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-2 border-b-2 font-semibold transition-colors ${
                  activeTab === 'products'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Бүтээгдэхүүн ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-2 border-b-2 font-semibold transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Үнэлгээ ({reviews.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'products' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {journalist.products.map((product: any) => (
                  <div
                    key={product.id}
                    onClick={() => router.push(`/products/${product.uuid || product.id}`)}
                    className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1"
                  >
                    <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 flex items-center space-x-1 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-full">
                        <span className="text-yellow-400 text-sm">⭐</span>
                        <span className="text-xs font-semibold">{product.rating}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {product.title}
                      </h4>
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>
                          {typeof product.category === 'object' && product.category?.name
                            ? product.category.name
                            : typeof product.category === 'string'
                            ? product.category
                            : 'N/A'}
                        </span>
                        <span>⬇️ {product.downloads}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {product.price.toLocaleString()}₮
                        </span>
                        <span className="text-xs text-gray-500">{product.createdAt}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {journalist.reviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start space-x-4">
                      <img
                        src={review.avatar}
                        alt={review.user}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {review.user}
                            </h4>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                                >
                                  ⭐
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">{review.date}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

