'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDarkMode } from '@/hooks/useDarkMode'
import { getCategoryById, getCategoryProducts } from '@/lib/api'
import { getCategoryIcon } from '@/lib/categoryIcon'
import WishlistHeartIcon from '@/components/WishlistHeartIcon'

export const dynamic = 'force-dynamic'

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

// Default products data (fallback)
const defaultProducts = [
  {
    id: 1,
    title: 'Монгол улсын эдийн засгийн хөгжил',
    category: 'Реферат',
    categoryId: 1,
    price: 15000,
    pages: 25,
    downloads: 234,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop'
  },
  {
    id: 2,
    title: 'Компьютерийн сүлжээний аюулгүй байдал',
    category: 'Дипломын ажил',
    categoryId: 1,
    price: 45000,
    pages: 80,
    downloads: 156,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop'
  },
  {
    id: 3,
    title: 'Action Adventure Game Pack',
    category: 'Тоглоом (EXE)',
    categoryId: 5,
    price: 25000,
    size: '2.5 GB',
    downloads: 892,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=250&fit=crop'
  },
  {
    id: 4,
    title: 'Мэдээллийн системийн дизайн',
    category: 'Курсын ажил',
    categoryId: 1,
    price: 20000,
    pages: 35,
    downloads: 178,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop'
  },
  {
    id: 5,
    title: 'Office Suite Pro 2024',
    category: 'Программ хангамж',
    categoryId: 4,
    price: 35000,
    size: '500 MB',
    downloads: 445,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop'
  },
  {
    id: 6,
    title: 'Монгол хэлний утга зохиол',
    category: 'Реферат',
    categoryId: 1,
    price: 12000,
    pages: 20,
    downloads: 312,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop'
  },
  {
    id: 7,
    title: 'Photoshop Template Pack',
    category: 'График дизайн',
    categoryId: 3,
    price: 18000,
    size: '150 MB',
    downloads: 567,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop'
  },
  {
    id: 8,
    title: 'Mobile Game Collection',
    category: 'Тоглоом',
    categoryId: 8,
    price: 22000,
    size: '1.2 GB',
    downloads: 789,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=250&fit=crop'
  }
]

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const { isDark } = useDarkMode()
  const categoryId = params?.id ? parseInt(params.id as string) : null
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null)
  const [category, setCategory] = useState<any>(null)
  const [categoryProducts, setCategoryProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!categoryId) return

      try {
        setLoading(true)
        const [categoryRes, productsRes] = await Promise.all([
          getCategoryById(categoryId).catch(() => ({ category: defaultCategories.find(c => c.id === categoryId) })),
          getCategoryProducts(categoryId, 1, 100).catch(() => ({ products: defaultProducts.filter((p: any) => p.categoryId === categoryId) }))
        ])

        if (categoryRes.category) {
          setCategory(categoryRes.category)
        }
        if (productsRes.products) {
          setCategoryProducts(productsRes.products)
        }
      } catch (error) {
        console.error('Error fetching category data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [categoryId])

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

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ангилал олдсонгүй
          </h2>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Нүүр хуудас руу буцах
          </button>
        </div>
      </div>
    )
  }

  const subcategories = category.subcategories || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="w-full px-3 sm:px-4 lg:container lg:mx-auto">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <span>←</span>
              <span>Буцах</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              tbarimt
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="w-full px-3 sm:px-4 lg:container lg:mx-auto py-8">
        {/* Category Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-6xl">{getCategoryIcon(category.icon)}</span>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {category.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {categoryProducts.length} бүтээгдэхүүн олдлоо
              </p>
            </div>
          </div>
        </div>

        {/* Subcategories Section */}
        {subcategories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Дэд ангилалууд
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {subcategories.map((subcategory: any) => (
                <button
                  key={subcategory.id}
                  onClick={() => {
                    router.push(`/category/${categoryId}?subcategory=${subcategory.id}`)
                  }}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 text-left transform hover:-translate-y-0.5 ${
                    selectedSubcategory === subcategory.id
                      ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 dark:border-blue-400 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {subcategory.name}
                  </h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Бүтээгдэхүүнүүд
          </h2>
          {categoryProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => router.push(`/products/${(product as any).uuid || (product as any).id}`)}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 transform hover:-translate-y-2 group cursor-pointer"
                >
                  {/* Product Image */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
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
                      <div className="flex items-center space-x-1 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-full">
                        <span className="text-yellow-400 text-sm">⭐</span>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {parseFloat((product as any).rating) || 0}
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-md">
                        {typeof (product as any).category === 'object' && (product as any).category?.name
                          ? (product as any).category.name
                          : typeof (product as any).category === 'string'
                          ? (product as any).category
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {(product as any).title}
                    </h4>
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <span className="flex items-center space-x-1">
                        <span>📄</span>
                        <span>{(product as any).pages ? `${(product as any).pages} хуудас` : (product as any).size || 'N/A'}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>⬇️</span>
                        <span>{(product as any).downloads || 0}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 gap-3">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {parseFloat((product as any).price || 0).toLocaleString()}₮
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
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Энэ ангилалд одоогоор бүтээгдэхүүн байхгүй байна.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

