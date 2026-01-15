'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDarkMode } from '@/hooks/useDarkMode'
import { getSubcategoryById, getSubcategoryProducts } from '@/lib/api'
import { getCategoryIcon } from '@/lib/categoryIcon'
import WishlistHeartIcon from '@/components/WishlistHeartIcon'

export const dynamic = 'force-dynamic'

export default function SubcategoryPage() {
  const params = useParams()
  const router = useRouter()
  const { isDark } = useDarkMode()
  const subcategoryId = params?.id ? parseInt(params.id as string) : null
  const [subcategory, setSubcategory] = useState<any>(null)
  const [subcategoryProducts, setSubcategoryProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!subcategoryId) return

      try {
        setLoading(true)
        const [subcategoryRes, productsRes] = await Promise.all([
          getSubcategoryById(subcategoryId).catch(() => ({ subcategory: null })),
          getSubcategoryProducts(subcategoryId, 1, 100).catch(() => ({ products: [] }))
        ])

        if (subcategoryRes.subcategory) {
          setSubcategory(subcategoryRes.subcategory)
        }
        if (productsRes.products) {
          setSubcategoryProducts(productsRes.products)
        }
      } catch (error) {
        console.error('Error fetching subcategory data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [subcategoryId])

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

  if (!subcategory) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Дэд ангилал олдсонгүй
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

  const category = subcategory.category

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => router.push(category ? `/category/${category.id}` : '/')}
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <span>←</span>
              <span>{category ? category.name : 'Буцах'}</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              tbarimt
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Subcategory Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 mb-4">
            {category && (
              <span className="text-6xl">{getCategoryIcon(category.icon)}</span>
            )}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                {category && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {category.name} / 
                  </span>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  {subcategory.name}
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {subcategoryProducts.length} бүтээгдэхүүн олдлоо
              </p>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Бүтээгдэхүүнүүд
          </h2>
          {subcategoryProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subcategoryProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => router.push(`/products/${product.uuid || product.id}`)}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 transform hover:-translate-y-2 group cursor-pointer"
                >
                  {/* Product Image */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                    <img
                      src={product.image || '/placeholder.png'}
                      alt={product.title}
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
                          productId={product.uuid || product.id} 
                          size="sm"
                        />
                      </div>
                      {/* Star Rating */}
                      <div className="flex items-center space-x-1 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-full">
                        <span className="text-yellow-400 text-sm">⭐</span>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {parseFloat(product.rating) || 0}
                        </span>
                      </div>
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
                        <span>{product.pages ? `${product.pages} хуудас` : product.size || 'N/A'}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>⬇️</span>
                        <span>{product.downloads || 0}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 gap-3">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {parseFloat(product.price || 0).toLocaleString()}₮
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/products/${product.uuid || product.id}`)
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
                Энэ дэд ангилалд одоогоор бүтээгдэхүүн байхгүй байна.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

