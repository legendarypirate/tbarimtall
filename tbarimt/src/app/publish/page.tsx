'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { createProductWithFiles, createQPayInvoice, checkQPayPaymentStatus, getMyMembership } from '@/lib/api'

// Categories matching the home page
const categories = [
  { id: 1, name: 'Реферат' },
  { id: 2, name: 'Дипломын ажил' },
  { id: 3, name: 'Тоглоом (EXE)' },
  { id: 4, name: 'Программ хангамж' },
  { id: 5, name: 'Курсын ажил' },
  { id: 6, name: 'Бусад' }
]

export default function PublishPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    pages: '',
    size: '',
    image: null as File | null,
    file: null as File | null,
    isUnique: false
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrText, setQrText] = useState<string | null>(null)
  const [qrImageError, setQrImageError] = useState(false)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed' | null>(null)
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [createdProductId, setCreatedProductId] = useState<string | null>(null)
  const paymentCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [membershipInfo, setMembershipInfo] = useState<any>(null)

  useEffect(() => {
    // Check if user is logged in as journalist
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        if (parsedUser.role === 'journalist') {
          setUser(parsedUser)
        } else {
          router.push('/login')
        }
      } catch (e) {
        router.push('/login')
      }
    } else {
      router.push('/login')
    }

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [router])

  // Cleanup payment polling on unmount
  useEffect(() => {
    return () => {
      if (paymentCheckInterval.current) {
        clearInterval(paymentCheckInterval.current)
      }
    }
  }, [])

  // Fetch membership info to get file size limit
  useEffect(() => {
    const fetchMembershipInfo = async () => {
      try {
        const data = await getMyMembership()
        setMembershipInfo(data)
      } catch (error) {
        console.error('Error fetching membership info:', error)
      }
    }
    if (user) {
      fetchMembershipInfo()
    }
  }, [user])

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
      // Check file size limit if membership has one
      if (membershipInfo?.membership?.fileSizeLimit) {
        const limitInBytes = convertToBytes(
          membershipInfo.membership.fileSizeLimit,
          membershipInfo.membership.fileSizeLimitUnit || 'MB'
        )
        
        if (file.size > limitInBytes) {
          setErrors(prev => ({
            ...prev,
            file: 'Та төлбөртэй хувилбар сонгож тус файлыг оруулах боломжтой.'
          }))
          e.target.value = '' // Clear the input
          return
        }
      }
      
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

  // Helper function to convert file size to bytes
  const convertToBytes = (size: number, unit: 'MB' | 'GB' | 'TB'): number => {
    switch (unit) {
      case 'MB':
        return size * 1024 * 1024
      case 'GB':
        return size * 1024 * 1024 * 1024
      case 'TB':
        return size * 1024 * 1024 * 1024 * 1024
      default:
        return size * 1024 * 1024
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

    if (!formData.category) {
      newErrors.category = 'Ангилал сонгох шаардлагатай'
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

  const startPaymentPolling = (invoiceId: string) => {
    // Clear any existing interval
    if (paymentCheckInterval.current) {
      clearInterval(paymentCheckInterval.current)
    }

    // Check payment status every 3 seconds
    paymentCheckInterval.current = setInterval(async () => {
      try {
        const response = await checkQPayPaymentStatus(invoiceId)
        if (response.success && response.payment) {
          if (response.payment.isPaid) {
            setPaymentStatus('paid')
            if (paymentCheckInterval.current) {
              clearInterval(paymentCheckInterval.current)
              paymentCheckInterval.current = null
            }
            
            // Close payment modal after 2 seconds and redirect
            setTimeout(() => {
              setIsPaymentModalOpen(false)
              setQrCode(null)
              setQrText(null)
              setQrImageError(false)
              setInvoiceId(null)
              setPaymentStatus(null)
              
              // Show success and redirect
              alert('Төлбөр амжилттай төлөгдлөө! Контент онцгой болголоо.')
              router.push('/account/journalist')
            }, 2000)
          }
        }
      } catch (error) {
        console.error('Payment check error:', error)
      }
    }, 3000)
  }

  const handleUniquePayment = async () => {
    if (!createdProductId) {
      setPaymentError('Бүтээгдэхүүн үүсээгүй байна')
      return
    }

    try {
      setIsCreatingInvoice(true)
      setPaymentError(null)

      const response = await createQPayInvoice({
        productId: createdProductId,
        amount: 2000,
        description: 'Онцгой бүтээгдэхүүн болгох төлбөр'
      })

      if (response.success && response.invoice) {
        setInvoiceId(response.invoice.invoice_id)
        setQrCode(response.invoice.qr_image || response.invoice.qr_code)
        setQrText(response.invoice.qr_text)
        setQrImageError(false)
        setPaymentStatus('pending')
        
        // Start polling for payment status
        startPaymentPolling(response.invoice.invoice_id)
      } else {
        throw new Error('Failed to create invoice')
      }
    } catch (error: any) {
      console.error('QPay payment error:', error)
      setPaymentError(error.message || 'QPay төлбөр үүсгэхэд алдаа гарлаа')
    } finally {
      setIsCreatingInvoice(false)
    }
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
      uploadData.append('categoryId', formData.category)
      uploadData.append('price', formData.price)
      if (formData.pages) uploadData.append('pages', formData.pages)
      if (formData.size) uploadData.append('size', formData.size)
      if (formData.image) uploadData.append('image', formData.image)
      if (formData.file) uploadData.append('file', formData.file)
      // Default status is always 'new' for journalist products
      uploadData.append('status', 'new')
      // Don't set isUnique yet - will be set after payment
      uploadData.append('isUnique', 'false')

      // Call the API to create product
      const response = await createProductWithFiles(uploadData)

      // If user wants unique product, show payment modal
      if (formData.isUnique && response.product) {
        setCreatedProductId(response.product.uuid || response.product.id)
        setIsLoading(false)
        setIsPaymentModalOpen(true)
        // Start payment flow
        await handleUniquePayment()
      } else {
        // Show success and redirect
        alert('Контент амжилттай нийтлэгдлээ!')
        router.push('/account/journalist')
      }
    } catch (error: any) {
      console.error('Error publishing content:', error)
      const errorMessage = error.message || 'Алдаа гарлаа. Дахин оролдоно уу.'
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Ачааллаж байна...</p>
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
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 overflow-hidden">
                <img src="/lg.png" alt="TBARIMT Logo" className="w-full h-full object-contain" />
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
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      router.push('/search')
                    }
                  }}
                  placeholder="Хайх..."
                  className="block w-full pl-12 pr-4 py-3 border-2 border-[#004e6c]/20 rounded-xl bg-white text-[#004e6c] placeholder-[#004e6c]/40 focus:outline-none focus:ring-2 focus:ring-[#004e6c]/30 focus:border-[#004e6c] text-sm font-medium transition-all shadow-sm hover:shadow-md"
                />
              </div>
            </div>
            
            {/* Upload and Dipbard Buttons */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => router.push('/account/journalist')}
                className="bg-[#004e6c] text-white px-5 py-2.5 rounded-xl hover:bg-[#ff6b35] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Dashboard
              </button>
              
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
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/lg.png" alt="TBARIMT Logo" className="w-full h-full object-contain" />
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-[#004e6c]/20">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#004e6c] mb-2">
              Шинэ контент нийтлэх
            </h2>
            <p className="text-[#004e6c]/70 font-medium">
              Контент, зураг, файл оруулаад нийтлээрэй
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.title
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-[#004e6c]/20 focus:border-[#004e6c]'
                } bg-white text-[#004e6c] focus:outline-none focus:ring-2 focus:ring-[#004e6c]/30 transition-colors font-medium`}
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
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.description
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-[#004e6c]/20 focus:border-[#004e6c]'
                } bg-white text-[#004e6c] focus:outline-none focus:ring-2 focus:ring-[#004e6c]/30 transition-colors resize-none font-medium`}
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
                <label htmlFor="category" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Ангилал <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.category
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-[#004e6c]/20 focus:border-[#004e6c]'
                } bg-white text-[#004e6c] focus:outline-none focus:ring-2 focus:ring-[#004e6c]/30 transition-colors font-medium`}
                >
                  <option value="">Ангилал сонгох</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-500">{errors.category}</p>
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
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.price
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-[#004e6c]/20 focus:border-[#004e6c]'
                } bg-white text-[#004e6c] focus:outline-none focus:ring-2 focus:ring-[#004e6c]/30 transition-colors font-medium`}
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#004e6c]/20 focus:border-[#004e6c] bg-white text-[#004e6c] focus:outline-none focus:ring-2 focus:ring-[#004e6c]/30 transition-colors font-medium"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#004e6c]/20 focus:border-[#004e6c] bg-white text-[#004e6c] focus:outline-none focus:ring-2 focus:ring-[#004e6c]/30 transition-colors font-medium"
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

            {/* Unique Product Checkbox */}
            <div>
              <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <input
                  type="checkbox"
                  id="isUnique"
                  name="isUnique"
                  checked={formData.isUnique}
                  onChange={(e) => setFormData(prev => ({ ...prev, isUnique: e.target.checked }))}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isUnique" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                  Онцгой болгох (2000₮ төлбөртэй)
                </label>
              </div>
              {formData.isUnique && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  ⚠️ Онцгой болгох үед та 2000₮ төлбөр төлөх шаардлагатай. Бүтээгдэхүүн үүсгэсний дараа QPay төлбөрийн QR код гарч ирнэ.
                </p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-[#004e6c] to-[#ff6b35] text-white px-6 py-3 rounded-xl hover:from-[#006b8f] hover:to-[#ff8555] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
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
                onClick={() => router.push('/account/journalist')}
                className="px-6 py-3 rounded-xl border-2 border-[#004e6c]/20 text-[#004e6c] hover:bg-[#004e6c]/10 hover:border-[#ff6b35]/50 transition-all duration-300 font-semibold"
              >
                Цуцлах
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* QPay Payment Modal */}
      {isPaymentModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            if (paymentStatus !== 'pending') {
              setIsPaymentModalOpen(false)
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-[#004e6c]/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#004e6c]">
                Онцгой болгох төлбөр
              </h3>
              {paymentStatus !== 'pending' && (
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              )}
            </div>

            <div className="mb-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Төлбөрийн дүн:</span>
                  <span className="text-2xl font-bold text-[#004e6c]">
                    2,000₮
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Онцгой бүтээгдэхүүн болгох төлбөр
                </div>
              </div>

              {paymentError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <p className="text-red-800 dark:text-red-200 text-sm">{paymentError}</p>
                  <button
                    onClick={() => {
                      setPaymentError(null)
                      setIsPaymentModalOpen(false)
                    }}
                    className="mt-2 text-red-600 dark:text-red-400 text-sm underline"
                  >
                    Буцах
                  </button>
                </div>
              )}

              {isCreatingInvoice && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-[#004e6c] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-[#004e6c]/70 font-medium">Төлбөрийн QR код бэлдэж байна...</p>
                </div>
              )}

              {(qrCode || qrText) && !paymentError && !isCreatingInvoice && (
                <>
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-[#004e6c] mb-2">
                      QPay QR код уншуулах
                    </h4>
                    <p className="text-sm text-[#004e6c]/70 mb-4 font-medium">
                      QPay апп-аар QR кодыг уншуулж төлбөрөө төлнө үү
                    </p>
                    <div className="bg-white p-4 rounded-xl border-2 border-[#004e6c]/20 inline-block">
                      {qrCode && !qrImageError ? (
                        <img
                          src={qrCode}
                          alt="QPay QR Code"
                          className="w-64 h-64 mx-auto"
                          onError={() => {
                            setQrImageError(true)
                          }}
                        />
                      ) : qrText ? (
                        <div className="w-64 h-64 mx-auto flex items-center justify-center">
                          <QRCodeSVG
                            value={qrText}
                            size={256}
                            level="M"
                            includeMargin={true}
                            className="w-full h-full"
                          />
                        </div>
                      ) : null}
                    </div>

                    {paymentStatus === 'paid' && (
                      <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="text-green-800 dark:text-green-200 text-center font-semibold">
                          ✅ Төлбөр амжилттай төлөгдлөө!
                        </p>
                      </div>
                    )}

                    {paymentStatus === 'pending' && (
                      <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-blue-800 dark:text-blue-200 text-center text-sm">
                          Төлбөрийн статус шалгаж байна...
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

