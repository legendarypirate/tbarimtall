'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createWithdrawalRequest, getMyWithdrawalRequests, getMyProducts, getMyStatistics, getCategories, createProductWithFiles, updateProduct, createUniqueProductInvoice, checkQPayPaymentStatus, getProductById, createWalletRechargeInvoice, checkWalletRechargeStatus } from '@/lib/api'
import MembershipBar from '@/components/MembershipBar'

// Interface for product data
interface ProductData {
  id: number;
  uuid?: string; // UUID for navigation
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
  isUnique?: boolean;
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
    files: [] as File[],
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [existingFileInfo, setExistingFileInfo] = useState<{ url: string; name: string; type: string } | null>(null)
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
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null)
  const [showUniqueModal, setShowUniqueModal] = useState(false)
  const [uniqueProduct, setUniqueProduct] = useState<ProductData | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrText, setQrText] = useState<string | null>(null)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending')
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false)
  const [paymentPollingInterval, setPaymentPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [showWalletRechargeModal, setShowWalletRechargeModal] = useState(false)
  const [walletRechargeAmount, setWalletRechargeAmount] = useState('')
  const [walletRechargeQrCode, setWalletRechargeQrCode] = useState<string | null>(null)
  const [walletRechargeQrText, setWalletRechargeQrText] = useState<string | null>(null)
  const [walletRechargeInvoiceId, setWalletRechargeInvoiceId] = useState<string | null>(null)
  const [walletRechargeStatus, setWalletRechargeStatus] = useState<'pending' | 'completed' | 'failed'>('pending')
  const [isCreatingWalletInvoice, setIsCreatingWalletInvoice] = useState(false)
  const [walletRechargePollingInterval, setWalletRechargePollingInterval] = useState<NodeJS.Timeout | null>(null)

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
      
      // Fetch products, statistics, and latest user profile in parallel
      // Construct API URL properly to avoid double /api/api/
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      // Remove trailing /api if present to avoid double /api/api/
      const baseUrl = apiBaseUrl.trim().endsWith('/api') 
        ? apiBaseUrl.trim().slice(0, -4) 
        : apiBaseUrl.trim()
      const profileUrl = `${baseUrl}/api/auth/profile`
      
      const [productsResponse, statsResponse, userProfileResponse] = await Promise.all([
        getMyProducts({ limit: 100 }),
        getMyStatistics(),
        fetch(profileUrl, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }).then(res => res.json()).catch(() => null)
      ])

      if (productsResponse.products) {
        // Map products to include earnings calculation
      const mappedProducts = productsResponse.products.map((product: any) => ({
        id: product.id,
        uuid: product.uuid, // Include UUID for navigation
        title: product.title,
        category: product.category || 'Бусад',
        price: product.price,
        views: product.views || 0,
        downloads: product.downloads || 0,
        earnings: (product.price || 0) * (product.downloads || 0),
        status: product.status || 'draft',
        createdAt: product.createdAt,
        image: product.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${product.title}`,
        description: product.description,
        isUnique: product.isUnique || false
      }))
        setProducts(mappedProducts)
      }

      if (statsResponse.stats) {
        setStats(statsResponse.stats)
      }

      // Update user with latest profile data including income
      if (userProfileResponse && userProfileResponse.user) {
        setUser(userProfileResponse.user)
        // Update localStorage with latest user data
        localStorage.setItem('user', JSON.stringify(userProfileResponse.user))
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
    localStorage.removeItem('token')
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
    const files = e.target.files
    if (files && files.length > 0) {
      const imageFile = files[0]
      if (!imageFile.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'Зөвхөн зураг файл оруулна уу' }))
        return
      }
      setFormData(prev => ({ ...prev, image: imageFile }))
      // Create preview for the image
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        setExistingImageUrl(null) // Clear existing image URL when new image is selected
      }
      reader.readAsDataURL(imageFile)
      // Clear error
      if (errors.image) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.image
          return newErrors
        })
      }
    }
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }))
    setImagePreview(null)
    setExistingImageUrl(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const fileArray = Array.from(files)
      setFormData(prev => ({ ...prev, files: fileArray }))
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

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }))
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

    if (!editingProduct && formData.files.length === 0 && !existingFileInfo) {
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
      if (editingProduct) {
        // Update existing product
        await updateProduct(editingProduct.id, {
          title: formData.title,
          description: formData.description,
          categoryId: parseInt(formData.categoryId),
          price: parseFloat(formData.price),
          pages: formData.pages ? parseInt(formData.pages) : null,
          size: formData.size || null,
          status: 'new'
        })

        alert('Контент амжилттай шинэчлэгдлээ!')
      } else {
        // Create new product
        const uploadData = new FormData()
        uploadData.append('title', formData.title)
        uploadData.append('description', formData.description)
        uploadData.append('categoryId', formData.categoryId)
        uploadData.append('price', formData.price)
        if (formData.pages) uploadData.append('pages', formData.pages)
        if (formData.size) uploadData.append('size', formData.size)
        // Append single image
        if (formData.image) {
          uploadData.append('image', formData.image)
        }
        // Append all files
        formData.files.forEach((file) => {
          uploadData.append('files', file)
        })
        uploadData.append('status', 'new')

        await createProductWithFiles(uploadData)
        alert('Контент амжилттай нийтлэгдлээ!')
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        categoryId: '',
        price: '',
        pages: '',
        size: '',
        image: null,
        files: []
      })
      setImagePreview(null)
      setExistingImageUrl(null)
      setExistingFileInfo(null)
      setErrors({})
      setEditingProduct(null)
      setShowAddProduct(false)

      // Refresh products list
      if (user) {
        fetchData(user)
      }
    } catch (error: any) {
      console.error('Error saving content:', error)
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
      setEditingProduct(null)
      setFormData({
        title: '',
        description: '',
        categoryId: '',
        price: '',
        pages: '',
        size: '',
        image: null,
        files: []
      })
      setImagePreview(null)
      setExistingImageUrl(null)
      setExistingFileInfo(null)
      setErrors({})
    }, 300)
  }

  const handleEditProduct = async (product: ProductData) => {
    setEditingProduct(product)
    setFormData({
      title: product.title,
      description: product.description || '',
      categoryId: typeof product.category === 'object' ? product.category.id.toString() : '',
      price: product.price.toString(),
      pages: '',
      size: '',
      image: null,
      files: []
    })
    
    // Set existing image URL for preview
    if (product.image) {
      setExistingImageUrl(product.image)
      setImagePreview(null)
    } else {
      setExistingImageUrl(null)
      setImagePreview(null)
    }
    
    // Fetch full product details to get file information
    try {
      const fullProduct = await getProductById(product.id)
      if (fullProduct.product) {
        const prod = fullProduct.product
        // Set existing file info if available
        if (prod.fileUrl || prod.cloudinaryFileUrl) {
          setExistingFileInfo({
            url: prod.fileUrl || prod.cloudinaryFileUrl,
            name: prod.fileType === 'zip' ? 'product_files.zip' : 'product_file',
            type: prod.fileType || 'unknown'
          })
        } else {
          setExistingFileInfo(null)
        }
      }
    } catch (error) {
      console.error('Error fetching product details:', error)
      setExistingFileInfo(null)
    }
    
    setShowAddProduct(true)
  }

  const handleMakeUnique = async (product: ProductData) => {
    try {
      setIsCreatingInvoice(true)
      setUniqueProduct(product)
      setPaymentStatus('pending')
      
      const response = await createUniqueProductInvoice(product.id)
      
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
        setShowUniqueModal(true)
        
        // Start polling for payment status
        startPaymentPolling(response.invoice.invoice_id)
      } else {
        throw new Error('Failed to create invoice')
      }
    } catch (error: any) {
      console.error('Error creating unique product invoice:', error)
      alert(error.message || 'Онцгой болгох төлбөр үүсгэхэд алдаа гарлаа')
    } finally {
      setIsCreatingInvoice(false)
    }
  }

  const startPaymentPolling = (invoiceId: string) => {
    // Clear any existing interval
    if (paymentPollingInterval) {
      clearInterval(paymentPollingInterval)
    }

    const interval = setInterval(async () => {
      try {
        const response = await checkQPayPaymentStatus(invoiceId)
        
        if (response.success && response.payment) {
          if (response.payment.isPaid) {
            setPaymentStatus('completed')
            clearInterval(interval)
            setPaymentPollingInterval(null)
            
            // Refresh products to show updated isUnique status
            if (user) {
              await fetchData(user)
            }
            
            // Close modal after 2 seconds
            setTimeout(() => {
              setShowUniqueModal(false)
              setUniqueProduct(null)
              setQrCode(null)
              setQrText(null)
              setInvoiceId(null)
              setPaymentStatus('pending')
            }, 2000)
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error)
      }
    }, 3000) // Check every 3 seconds

    setPaymentPollingInterval(interval)
  }

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (paymentPollingInterval) {
        clearInterval(paymentPollingInterval)
      }
      if (walletRechargePollingInterval) {
        clearInterval(walletRechargePollingInterval)
      }
    }
  }, [paymentPollingInterval, walletRechargePollingInterval])

  const handleWalletRecharge = async () => {
    if (!walletRechargeAmount || parseFloat(walletRechargeAmount) <= 0) {
      alert('Зөв дүн оруулна уу')
      return
    }

    try {
      setIsCreatingWalletInvoice(true)
      setWalletRechargeStatus('pending')
      
      const response = await createWalletRechargeInvoice(parseFloat(walletRechargeAmount))
      
      if (response.success && response.invoice) {
        setWalletRechargeInvoiceId(response.invoice.invoice_id)
        
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
          setWalletRechargeQrCode(qrImage)
        } else {
          setWalletRechargeQrCode(null)
          console.error('Invalid QR code format:', qrImage?.substring(0, 50))
        }
        setWalletRechargeQrText(response.invoice.qr_text)
        
        // Start polling for payment status
        startWalletRechargePolling(response.invoice.invoice_id)
      } else {
        throw new Error('Failed to create wallet recharge invoice')
      }
    } catch (error: any) {
      console.error('Error creating wallet recharge invoice:', error)
      alert(error.message || 'Данс цэнэглэх төлбөр үүсгэхэд алдаа гарлаа')
    } finally {
      setIsCreatingWalletInvoice(false)
    }
  }

  const startWalletRechargePolling = (invoiceId: string) => {
    // Clear any existing interval
    if (walletRechargePollingInterval) {
      clearInterval(walletRechargePollingInterval)
    }

    const interval = setInterval(async () => {
      try {
        const response = await checkWalletRechargeStatus(invoiceId)
        
        if (response.success && response.payment) {
          if (response.payment.isPaid) {
            setWalletRechargeStatus('completed')
            clearInterval(interval)
            setWalletRechargePollingInterval(null)
            
            // Refresh user data to show updated income
            if (user) {
              await fetchData(user)
            }
            
            // Close modal after 2 seconds
            setTimeout(() => {
              setShowWalletRechargeModal(false)
              setWalletRechargeAmount('')
              setWalletRechargeQrCode(null)
              setWalletRechargeQrText(null)
              setWalletRechargeInvoiceId(null)
              setWalletRechargeStatus('pending')
            }, 2000)
          }
        }
      } catch (error) {
        console.error('Error checking wallet recharge status:', error)
      }
    }, 3000) // Check every 3 seconds

    setWalletRechargePollingInterval(interval)
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
        {/* Membership Bar */}
        <MembershipBar />
        
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
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Онлайн данс</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {((user.income !== undefined && user.income !== null) ? parseFloat(user.income) : stats.totalEarnings).toLocaleString()}₮
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
            <div className="text-gray-600 dark:text-gray-400">Файл орлого</div>
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
              <div className="flex items-center gap-3 ml-4">
                <button
                  onClick={() => setShowWalletRechargeModal(true)}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-md"
                >
                  💰 Данс цэнэглэх
                </button>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md"
                >
                  + Шинэ нийтлэл
                </button>
              </div>
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
                              product.status === 'published' || product.status === 'new'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            }`}
                          >
                            {product.status === 'published' ? 'Нийтлэгдсэн' : product.status === 'new' ? 'Шинэ' : 'Ноорог'}
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
                          onClick={() => {
                            if (!product.uuid) {
                              console.error('Product missing UUID:', product.id);
                              alert('Алдаа: Бүтээгдэхүүнд UUID байхгүй байна. Админд хандана уу.');
                              return;
                            }
                            router.push(`/products/${product.uuid}`)
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold"
                        >
                          Үзэх
                        </button>
                        <button 
                          onClick={() => handleEditProduct(product)}
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all text-sm font-semibold"
                        >
                          Засах
                        </button>
                        {!product.isUnique && (
                          <button 
                            onClick={() => handleMakeUnique(product)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all text-sm font-semibold"
                          >
                            Онцгой болгох
                          </button>
                        )}
                        {product.isUnique && (
                          <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-4 py-2 rounded-lg text-sm font-semibold text-center">
                            ⭐ Онцгой
                          </span>
                        )}
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
                  {editingProduct ? 'Контент засах' : 'Шинэ контент нийтлэх'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {editingProduct ? 'Контентын мэдээллийг засна уу' : 'Контент, зураг, файл оруулаад нийтлээрэй'}
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
                <label className="cursor-pointer">
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className={`w-full px-4 py-3 rounded-lg border-2 border-dashed ${
                    errors.image
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
                  } transition-colors text-center bg-gray-50 dark:bg-gray-700/50`}>
                    <span className="text-gray-600 dark:text-gray-400">
                      {formData.image || existingImageUrl ? (
                        <span className="flex items-center justify-center space-x-2">
                          <span>🖼️</span>
                          <span>{formData.image ? formData.image.name : 'Одоогийн зураг'}</span>
                        </span>
                      ) : (
                        'Зураг сонгох'
                      )}
                    </span>
                  </div>
                </label>
                {(formData.image || existingImageUrl) && (
                  <div className="mt-3 relative group">
                    <img
                      src={imagePreview || existingImageUrl || ''}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.title}`;
                      }}
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {existingImageUrl && !formData.image && (
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        Одоогийн зураг
                      </div>
                    )}
                  </div>
                )}
                {errors.image && (
                  <p className="mt-1 text-sm text-red-500">{errors.image}</p>
                )}
              </div>

              {/* File Upload */}
              <div>
                <label htmlFor="files" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Файлууд {!editingProduct && <span className="text-red-500">*</span>}
                  <span className="text-xs text-gray-500 ml-2">(Олон файл сонгох боломжтой, ZIP болгож хадгална)</span>
                </label>
                {existingFileInfo && editingProduct && (
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>📦</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            Одоогийн файл: {existingFileInfo.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Төрөл: {existingFileInfo.type}
                          </p>
                        </div>
                      </div>
                      <a
                        href={existingFileInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        Татах
                      </a>
                    </div>
                  </div>
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    id="files"
                    name="files"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className={`w-full px-4 py-3 rounded-lg border-2 border-dashed ${
                    errors.file
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
                  } transition-colors text-center bg-gray-50 dark:bg-gray-700/50`}>
                    <span className="text-gray-600 dark:text-gray-400">
                      {formData.files.length > 0 ? (
                        <span className="flex flex-col items-center justify-center space-y-2">
                          <span className="text-sm font-semibold">
                            {formData.files.length} файл сонгогдлоо (ZIP болгож хадгална)
                          </span>
                        </span>
                      ) : (
                        'Файлууд сонгох (PDF, DOC, ZIP, EXE, зураг гэх мэт) - Олон файл сонгох боломжтой, ZIP болгож хадгална'
                      )}
                    </span>
                  </div>
                </label>
                {formData.files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <span>📄</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="ml-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {errors.file && (
                  <p className="mt-1 text-sm text-red-500">{errors.file}</p>
                )}
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
                      <span>{editingProduct ? 'Хадгалж байна...' : 'Нийтлэж байна...'}</span>
                    </>
                  ) : (
                    <>
                      <span>✅</span>
                      <span>{editingProduct ? 'Хадгалах' : 'Нийтлэх'}</span>
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

      {/* Wallet Recharge Modal */}
      {showWalletRechargeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Данс цэнэглэх
                </h2>
                <button
                  onClick={() => {
                    if (walletRechargePollingInterval) {
                      clearInterval(walletRechargePollingInterval)
                      setWalletRechargePollingInterval(null)
                    }
                    setShowWalletRechargeModal(false)
                    setWalletRechargeAmount('')
                    setWalletRechargeQrCode(null)
                    setWalletRechargeQrText(null)
                    setWalletRechargeInvoiceId(null)
                    setWalletRechargeStatus('pending')
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {walletRechargeStatus === 'completed' ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">
                    Төлбөр амжилттай!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Данс амжилттай цэнэглэгдлээ.
                  </p>
                </div>
              ) : walletRechargeQrCode ? (
                <div className="text-center space-y-4">
                  <div className="mb-4">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Цэнэглэх дүн: {parseFloat(walletRechargeAmount).toLocaleString()}₮
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <img 
                      src={walletRechargeQrCode} 
                      alt="QPay QR Code" 
                      className="w-64 h-64 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    QPay апп ашиглан QR кодыг уншуулж төлбөрөө төлнө үү.
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-yellow-600 dark:text-yellow-400">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
                    <span>Төлбөрийн статус шалгаж байна...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="rechargeAmount" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Цэнэглэх дүн (₮) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="rechargeAmount"
                      value={walletRechargeAmount}
                      onChange={(e) => setWalletRechargeAmount(e.target.value)}
                      min="1"
                      step="1000"
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                      placeholder="Жишээ: 100000"
                      disabled={isCreatingWalletInvoice}
                    />
                  </div>
                  <button
                    onClick={handleWalletRecharge}
                    disabled={isCreatingWalletInvoice || !walletRechargeAmount || parseFloat(walletRechargeAmount) <= 0}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isCreatingWalletInvoice ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Төлбөр үүсгэж байна...</span>
                      </>
                    ) : (
                      <>
                        <span>💰</span>
                        <span>Төлбөр үүсгэх</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unique Product Payment Modal */}
      {showUniqueModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Онцгой болгох төлбөр
                </h2>
                <button
                  onClick={() => {
                    if (paymentPollingInterval) {
                      clearInterval(paymentPollingInterval)
                      setPaymentPollingInterval(null)
                    }
                    setShowUniqueModal(false)
                    setUniqueProduct(null)
                    setQrCode(null)
                    setQrText(null)
                    setInvoiceId(null)
                    setPaymentStatus('pending')
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {uniqueProduct && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Бүтээгдэхүүн: <span className="font-semibold text-gray-900 dark:text-white">{uniqueProduct.title}</span>
                  </p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    Төлбөр: 2,000₮
                  </p>
                </div>
              )}

              {paymentStatus === 'completed' ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">
                    Төлбөр амжилттай!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Бүтээгдэхүүн амжилттай онцгой болголоо.
                  </p>
                </div>
              ) : (
                <>
                  {qrCode ? (
                    <div className="text-center space-y-4">
                      <div className="flex justify-center">
                        <img 
                          src={qrCode} 
                          alt="QPay QR Code" 
                          className="w-64 h-64 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        QPay апп ашиглан QR кодыг уншуулж төлбөрөө төлнө үү.
                      </p>
                      <div className="flex items-center justify-center space-x-2 text-sm text-yellow-600 dark:text-yellow-400">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
                        <span>Төлбөрийн статус шалгаж байна...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">Төлбөрийн QR код үүсгэж байна...</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

