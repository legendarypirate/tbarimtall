'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createWithdrawalRequest, getMyWithdrawalRequests, getMyProducts, getMyStatistics, getCategories, createProductWithFiles } from '@/lib/api'

// Interface for product data
interface ProductData {
  id: number;
  title: string;
  category?: { id: number; name: string; icon?: string } | string;
  price: number;
  views: number;
  downloads: number;
  earnings?: number;
  status: string;
  createdAt: string;
  image?: string;
  description?: string;
}

export default function JournalistAccount() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'products' | 'earnings' | 'analytics' | 'settings'>('products')
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<ProductData[]>([])
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalViews: 0,
    totalDownloads: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    followers: 0,
    rating: 0
  })
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    price: '',
    pages: '',
    size: '',
    image: null as File | null,
    file: null as File | null,
    status: 'draft' as 'draft' | 'published'
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([])
  const [withdrawalFormData, setWithdrawalFormData] = useState({
    amount: '',
    bankAccount: '',
    bankName: '',
    accountHolderName: '',
    notes: ''
  })
  const [withdrawalLoading, setWithdrawalLoading] = useState(false)
  const [categories, setCategories] = useState<Array<{ id: number; name: string; icon?: string }>>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      if (parsedUser.role === 'journalist' || parsedUser.role === 'viewer') {
        setUser(parsedUser)
        fetchData(parsedUser)
      } else {
        // If user exists but is not journalist, redirect to login
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router])

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true)
        const response = await getCategories()
        if (response.categories && Array.isArray(response.categories)) {
          setCategories(response.categories)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        // Fallback to empty array if fetch fails
        setCategories([])
      } finally {
        setIsLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  const fetchData = async (userData: any) => {
    try {
      setIsLoadingData(true)
      
      // Fetch products and statistics in parallel
      const [productsResponse, statsResponse] = await Promise.all([
        getMyProducts({ limit: 100 }),
        getMyStatistics()
      ])

      if (productsResponse.products) {
        // Map products to include earnings calculation
        const mappedProducts = productsResponse.products.map((product: any) => ({
          id: product.id,
          title: product.title,
          category: product.category || 'Бусад',
          price: product.price,
          views: product.views || 0,
          downloads: product.downloads || 0,
          earnings: (product.price || 0) * (product.downloads || 0),
          status: product.status || 'draft',
          createdAt: product.createdAt,
          image: product.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${product.title}`,
          description: product.description
        }))
        setProducts(mappedProducts)
      }

      if (statsResponse.stats) {
        setStats(statsResponse.stats)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    // Trigger animation when modal opens
    if (showAddProduct) {
      setTimeout(() => setIsPanelOpen(true), 10)
    } else {
      setIsPanelOpen(false)
    }
  }, [showAddProduct])

  useEffect(() => {
    // Fetch withdrawal requests when earnings tab is active
    if (activeTab === 'earnings' && user) {
      fetchWithdrawalRequests()
    }
  }, [activeTab, user])

  const fetchWithdrawalRequests = async () => {
    try {
      const response = await getMyWithdrawalRequests()
      if (response.withdrawalRequests) {
        setWithdrawalRequests(response.withdrawalRequests)
      }
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error)
    }
  }

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setWithdrawalLoading(true)
    setErrors({})

    try {
      if (!withdrawalFormData.amount || parseFloat(withdrawalFormData.amount) <= 0) {
        setErrors({ amount: 'Дүн зөв оруулна уу' })
        setWithdrawalLoading(false)
        return
      }

      await createWithdrawalRequest({
        amount: parseFloat(withdrawalFormData.amount),
        bankAccount: withdrawalFormData.bankAccount,
        bankName: withdrawalFormData.bankName,
        accountHolderName: withdrawalFormData.accountHolderName,
        notes: withdrawalFormData.notes
      })

      // Reset form and close modal
      setWithdrawalFormData({
        amount: '',
        bankAccount: '',
        bankName: '',
        accountHolderName: '',
        notes: ''
      })
      setShowWithdrawalModal(false)
      
      // Refresh withdrawal requests
      await fetchWithdrawalRequests()
    } catch (error: any) {
      console.error('Error creating withdrawal request:', error)
      setErrors({ submit: error.message || 'Хүсэлт илгээхэд алдаа гарлаа' })
    } finally {
      setWithdrawalLoading(false)
    }
  }

  const handleWithdrawalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setWithdrawalFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setFormData(prev => ({ ...prev, image: file }))
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setErrors(prev => ({ ...prev, image: 'Зөвхөн зураг файл оруулна уу' }))
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, file }))
      // Clear error
      if (errors.file) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.file
          return newErrors
        })
      }
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Гарчиг оруулах шаардлагатай'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Тайлбар оруулах шаардлагатай'
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Ангилал сонгох шаардлагатай'
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Зөв үнэ оруулах шаардлагатай'
    }

    if (!formData.file) {
      newErrors.file = 'Файл оруулах шаардлагатай'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Create form data for file upload
      const uploadData = new FormData()
      uploadData.append('title', formData.title)
      uploadData.append('description', formData.description)
      uploadData.append('categoryId', formData.categoryId)
      uploadData.append('price', formData.price)
      if (formData.pages) uploadData.append('pages', formData.pages)
      if (formData.size) uploadData.append('size', formData.size)
      if (formData.image) uploadData.append('image', formData.image)
      if (formData.file) uploadData.append('file', formData.file)
      // Map status: 'draft' -> 'new', 'published' -> 'new' (both create new products)
      uploadData.append('status', 'new')

      // Call the API to create product
      await createProductWithFiles(uploadData)

      // Reset form
      setFormData({
        title: '',
        description: '',
        categoryId: '',
        price: '',
        pages: '',
        size: '',
        image: null,
        file: null,
        status: 'draft'
      })
      setImagePreview(null)
      setErrors({})
      setShowAddProduct(false)

      // Show success message
      alert('Контент амжилттай нийтлэгдлээ!')
      
      // Refresh products list
      if (user) {
        fetchData(user)
      }
    } catch (error: any) {
      console.error('Error publishing content:', error)
      const errorMessage = error.message || 'Алдаа гарлаа. Дахин оролдоно уу.'
      alert(errorMessage)
      setErrors({ submit: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseModal = () => {
    setIsPanelOpen(false)
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setShowAddProduct(false)
      setFormData({
        title: '',
        description: '',
        categoryId: '',
        price: '',
        pages: '',
        size: '',
        image: null,
        file: null,
        status: 'draft'
      })
      setImagePreview(null)
      setErrors({})
    }, 300)
  }

  if (!user || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Ачааллаж байна...</p>
        </div>
      </div>
    )
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString('mn-MN')
  }

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
              <span>Нүүр</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Нийтлэлчийн данс
            </h1>
            <button
              onClick={handleLogout}
              className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Гарах
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName || user.email}`}
                alt={user.fullName || user.username}
                className="w-24 h-24 rounded-full border-4 border-blue-500 dark:border-blue-400"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.fullName || user.username || 'Хэрэглэгч'}
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                @{user.username} • {user.email}
              </p>
              <div className="flex items-center space-x-1">
                <span className="text-yellow-400">⭐</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {stats.rating.toFixed(1)}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {formatNumber(stats.followers)} дагагчид
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Нийт орлого</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.totalEarnings.toLocaleString()}₮
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Хүлээгдэж байна: {stats.pendingEarnings.toLocaleString()}₮
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {stats.totalProducts}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Нийтлэл</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {formatNumber(stats.totalViews)}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Нийт үзсэн</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {formatNumber(stats.totalDownloads)}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Татсан тоо</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {formatNumber(stats.totalEarnings)}₮
            </div>
            <div className="text-gray-600 dark:text-gray-400">Орлого</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700 px-6">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`py-4 px-2 border-b-2 font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'products'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Миний нийтлэл ({products.length})
                </button>
                <button
                  onClick={() => setActiveTab('earnings')}
                  className={`py-4 px-2 border-b-2 font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'earnings'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Орлого
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`py-4 px-2 border-b-2 font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'analytics'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Статистик
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`py-4 px-2 border-b-2 font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'settings'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Тохиргоо
                </button>
              </div>
              <button
                onClick={() => setShowAddProduct(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md ml-4"
              >
                + Шинэ нийтлэл
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'products' && (
              <div className="space-y-4">
                {products.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-gray-600 dark:text-gray-400">Одоогоор нийтлэл байхгүй байна</p>
                  </div>
                ) : (
                  products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={product.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${product.title}`}
                        alt={product.title}
                        className="w-24 h-24 rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${product.title}`;
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {product.title}
                          </h4>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              product.status === 'published'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            }`}
                          >
                            {product.status === 'published' ? 'Нийтлэгдсэн' : 'Ноорог'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {typeof product.category === 'object' && product.category?.name
                            ? product.category.name
                            : typeof product.category === 'string'
                            ? product.category
                            : 'N/A'} • {new Date(product.createdAt).toLocaleDateString('mn-MN')}
                        </p>
                        <div className="flex items-center space-x-6 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            👁️ {formatNumber(product.views)}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            ⬇️ {formatNumber(product.downloads)}
                          </span>
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {product.price.toLocaleString()}₮
                          </span>
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            Орлого: {(product.earnings || 0).toLocaleString()}₮
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => router.push(`/products/${product.id}`)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold"
                        >
                          Үзэх
                        </button>
                        <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all text-sm font-semibold">
                          Засах
                        </button>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'earnings' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Нийт орлого
                      </div>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {stats.totalEarnings.toLocaleString()}₮
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Хүлээгдэж байна
                      </div>
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {stats.pendingEarnings.toLocaleString()}₮
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => setShowWithdrawalModal(true)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md"
                    >
                      💰 Орлогын хүсэлт илгээх
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Орлогын хүсэлтийн түүх
                </h3>
                {withdrawalRequests.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-gray-600 dark:text-gray-400">Орлогын хүсэлт байхгүй байна</p>
                  </div>
                ) : (
                  withdrawalRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            Орлогын хүсэлт
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(request.createdAt).toLocaleDateString('mn-MN')}
                          </p>
                          {request.bankName && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Банк: {request.bankName}
                            </p>
                          )}
                          {request.adminNotes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">
                              Админий тайлбар: {request.adminNotes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600 dark:text-green-400">
                            {parseFloat(request.amount).toLocaleString()}₮
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              request.status === 'completed'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : request.status === 'approved'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                : request.status === 'rejected'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            }`}
                          >
                            {request.status === 'completed' 
                              ? 'Дууссан' 
                              : request.status === 'approved'
                              ? 'Зөвшөөрсөн'
                              : request.status === 'rejected'
                              ? 'Татгалзсан'
                              : 'Хүлээгдэж байна'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Хамгийн их үзсэн нийтлэл
                    </h3>
                    <div className="space-y-3">
                      {products.length === 0 ? (
                        <p className="text-gray-500">Мэдээлэл байхгүй</p>
                      ) : (
                        products
                        .sort((a, b) => b.views - a.views)
                        .slice(0, 3)
                        .map((product, index) => (
                          <div key={product.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl font-bold text-gray-400">
                                #{index + 1}
                              </span>
                              <span className="text-gray-900 dark:text-white">
                                {product.title}
                              </span>
                            </div>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {formatNumber(product.views)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Хамгийн их татсан нийтлэл
                    </h3>
                    <div className="space-y-3">
                      {products.length === 0 ? (
                        <p className="text-gray-500">Мэдээлэл байхгүй</p>
                      ) : (
                        products
                        .sort((a, b) => b.downloads - a.downloads)
                        .slice(0, 3)
                        .map((product, index) => (
                          <div key={product.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl font-bold text-gray-400">
                                #{index + 1}
                              </span>
                              <span className="text-gray-900 dark:text-white">
                                {product.title}
                              </span>
                            </div>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {formatNumber(product.downloads)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Профайл
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Нэр
                      </label>
                      <input
                        type="text"
                        defaultValue={user.fullName || user.username || ''}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Имэйл
                      </label>
                      <input
                        type="email"
                        defaultValue={user.email || ''}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Хэрэглэгчийн нэр
                      </label>
                      <input
                        type="text"
                        defaultValue={user.username || ''}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        disabled
                      />
                    </div>
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all font-semibold">
                      Хадгалах
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish Slide-in Panel */}
      {showAddProduct && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
            onClick={handleCloseModal}
          />
          
          {/* Slide-in Panel */}
          <div className={`fixed inset-y-0 right-0 w-full md:w-[600px] lg:w-[700px] bg-white dark:bg-gray-800 z-50 shadow-2xl overflow-y-auto transition-transform duration-300 ease-out ${
            isPanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-10">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Шинэ контент нийтлэх
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Контент, зураг, файл оруулаад нийтлээрэй
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-3xl leading-none w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Error message */}
              {errors.submit && (
                <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">{errors.submit}</p>
                </div>
              )}
              
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Гарчиг <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border-2 ${
                    errors.title
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors`}
                  placeholder="Контентын гарчиг оруулна уу"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Тайлбар <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  className={`w-full px-4 py-3 rounded-lg border-2 ${
                    errors.description
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors resize-none`}
                  placeholder="Контентын тайлбар оруулна уу"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                )}
              </div>

              {/* Category and Price Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <label htmlFor="categoryId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Ангилал <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    disabled={isLoadingCategories}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${
                      errors.categoryId
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value="">
                      {isLoadingCategories ? 'Ангилал ачааллаж байна...' : 'Ангилал сонгох'}
                    </option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="mt-1 text-sm text-red-500">{errors.categoryId}</p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label htmlFor="price" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Үнэ (₮) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="1000"
                    className={`w-full px-4 py-3 rounded-lg border-2 ${
                      errors.price
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors`}
                    placeholder="0"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-500">{errors.price}</p>
                  )}
                </div>
              </div>

              {/* Pages and Size Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pages (for documents) */}
                <div>
                  <label htmlFor="pages" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Хуудасны тоо (сонгох)
                  </label>
                  <input
                    type="number"
                    id="pages"
                    name="pages"
                    value={formData.pages}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                    placeholder="Жишээ: 25"
                  />
                </div>

                {/* Size (for games/software) */}
                <div>
                  <label htmlFor="size" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Хэмжээ (сонгох)
                  </label>
                  <input
                    type="text"
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                    placeholder="Жишээ: 2.5 GB"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label htmlFor="image" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Зураг (сонгох)
                </label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        id="image"
                        name="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <div className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-center bg-gray-50 dark:bg-gray-700/50">
                        <span className="text-gray-600 dark:text-gray-400">
                          {formData.image ? formData.image.name : 'Зураг сонгох'}
                        </span>
                      </div>
                    </label>
                  </div>
                  {imagePreview && (
                    <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, image: null }))
                          setImagePreview(null)
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Устгах
                      </button>
                    </div>
                  )}
                  {errors.image && (
                    <p className="text-sm text-red-500">{errors.image}</p>
                  )}
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label htmlFor="file" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Файл <span className="text-red-500">*</span>
                </label>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    id="file"
                    name="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className={`w-full px-4 py-3 rounded-lg border-2 border-dashed ${
                    errors.file
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
                  } transition-colors text-center bg-gray-50 dark:bg-gray-700/50`}>
                    <span className="text-gray-600 dark:text-gray-400">
                      {formData.file ? (
                        <span className="flex items-center justify-center space-x-2">
                          <span>📄</span>
                          <span>{formData.file.name}</span>
                          <span className="text-sm text-gray-500">
                            ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </span>
                      ) : (
                        'Файл сонгох (PDF, DOC, ZIP, EXE гэх мэт)'
                      )}
                    </span>
                  </div>
                </label>
                {errors.file && (
                  <p className="mt-1 text-sm text-red-500">{errors.file}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Төлөв
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                >
                  <option value="draft">Ноорог</option>
                  <option value="published">Нийтлэх</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800 pb-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Нийтлэж байна...</span>
                    </>
                  ) : (
                    <>
                      <span>✅</span>
                      <span>Нийтлэх</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold"
                >
                  Цуцлах
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Withdrawal Request Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Орлогын хүсэлт илгээх
                </h2>
                <button
                  onClick={() => setShowWithdrawalModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleWithdrawalSubmit} className="p-6 space-y-4">
              {errors.submit && (
                <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">{errors.submit}</p>
                </div>
              )}

              <div>
                <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Дүн (₮) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={withdrawalFormData.amount}
                  onChange={handleWithdrawalInputChange}
                  required
                  min="1"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  placeholder="Жишээ: 100000"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
                )}
              </div>

              <div>
                <label htmlFor="bankName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Банкны нэр
                </label>
                <input
                  type="text"
                  id="bankName"
                  name="bankName"
                  value={withdrawalFormData.bankName}
                  onChange={handleWithdrawalInputChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  placeholder="Жишээ: ХААН Банк"
                />
              </div>

              <div>
                <label htmlFor="accountHolderName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Дансны эзэмшлийн нэр
                </label>
                <input
                  type="text"
                  id="accountHolderName"
                  name="accountHolderName"
                  value={withdrawalFormData.accountHolderName}
                  onChange={handleWithdrawalInputChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  placeholder="Жишээ: Батбаяр"
                />
              </div>

              <div>
                <label htmlFor="bankAccount" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Дансны дугаар
                </label>
                <input
                  type="text"
                  id="bankAccount"
                  name="bankAccount"
                  value={withdrawalFormData.bankAccount}
                  onChange={handleWithdrawalInputChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  placeholder="Жишээ: 1234567890"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Нэмэлт тайлбар
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={withdrawalFormData.notes}
                  onChange={handleWithdrawalInputChange}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  placeholder="Нэмэлт мэдээлэл..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={withdrawalLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {withdrawalLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Илгээж байна...</span>
                    </>
                  ) : (
                    <>
                      <span>💰</span>
                      <span>Хүсэлт илгээх</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdrawalModal(false)}
                  className="px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold"
                >
                  Цуцлах
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

