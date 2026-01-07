'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { getProductById, getBanners, createQPayInvoice, checkQPayPaymentStatus, getOrderByInvoice, payWithWallet, getCurrentUser } from '@/lib/api'

export const dynamic = 'force-dynamic'

// Default product data (fallback)
const defaultProductsData: { [key: string]: any } = {
  '1': {
    id: 1,
    title: 'Монгол улсын эдийн засгийн хөгжил',
    category: 'Реферат',
    price: 15000,
    pages: 25,
    downloads: 234,
    views: 1250,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=500&fit=crop',
    description: 'Монгол улсын эдийн засгийн хөгжлийн тухай бүрэн дүүрэн судалгаа. Эдийн засгийн бүтэц, хөгжлийн чиглэл, сорилтууд болон боломжуудыг нарийвчлан авч үзсэн.',
    author: {
      id: 1,
      name: 'Батбаяр',
      username: '@batbayar_pro',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Batbayar',
      rating: 4.9
    },
    previewImages: [
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=500&fit=crop'
    ],
    tags: ['Эдийн засаг', 'Монгол улс', 'Хөгжил', 'Судалгаа'],
    createdAt: '2024-01-15',
    fileType: 'PDF',
    fileSize: '2.5 MB'
  },
  '2': {
    id: 2,
    title: 'Компьютерийн сүлжээний аюулгүй байдал',
    category: 'Дипломын ажил',
    price: 45000,
    pages: 80,
    downloads: 156,
    views: 890,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=500&fit=crop',
    description: 'Компьютерийн сүлжээний аюулгүй байдлын тухай бүрэн дүүрэн дипломын ажил. Орчин үеийн аюул заналхийлэл, хамгаалах арга хэмжээ, практик жишээнүүдийг багтаасан.',
    author: {
      id: 3,
      name: 'Энхбат',
      username: '@enkhat_dev',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Enkhat',
      rating: 4.9
    },
    previewImages: [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=500&fit=crop'
    ],
    tags: ['Сүлжээ', 'Аюулгүй байдал', 'Кибер аюул', 'Технологи'],
    createdAt: '2024-02-20',
    fileType: 'PDF',
    fileSize: '5.2 MB',
    isDiploma: true
  },
  '3': {
    id: 3,
    title: 'Action Adventure Game Pack',
    category: 'Тоглоом (EXE)',
    price: 25000,
    size: '2.5 GB',
    downloads: 892,
    views: 2340,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=500&fit=crop',
    description: 'Гайхалтай action adventure тоглоом. Олон түвшин, сонирхолтой түүх, гайхалтай график.',
    author: {
      id: 4,
      name: 'Оюунцэцэг',
      username: '@oyuntsetseg',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oyuntsetseg',
      rating: 4.7
    },
    previewImages: [
      'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=500&fit=crop'
    ],
    tags: ['Тоглоом', 'Action', 'Adventure', 'EXE'],
    createdAt: '2024-03-10',
    fileType: 'EXE',
    fileSize: '2.5 GB'
  }
}

export default function ProductDetail() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'qpay' | 'bank' | null>(null)
  const [product, setProduct] = useState<any>(defaultProductsData[productId] || defaultProductsData['1'])
  const [loading, setLoading] = useState(true)
  const [banners, setBanners] = useState<any[]>([])
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrText, setQrText] = useState<string | null>(null)
  const [qrImageError, setQrImageError] = useState(false)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed' | null>(null)
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [bankUrls, setBankUrls] = useState<any[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const paymentCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const [downloadToken, setDownloadToken] = useState<{ token: string; expiresAt: string } | null>(null)
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userBalance, setUserBalance] = useState<number>(0)
  const [isProcessingWalletPayment, setIsProcessingWalletPayment] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const response = await getProductById(productId)
        if (response.product) {
          setProduct(response.product)
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  // Check authentication and get user balance
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (token) {
          const userResponse = await getCurrentUser()
          if (userResponse.user) {
            setIsAuthenticated(true)
            setUserBalance(parseFloat(userResponse.user.income || 0))
          }
        }
      } catch (error) {
        // User not authenticated or error
        setIsAuthenticated(false)
        setUserBalance(0)
      }
    }
    checkAuth()
  }, [])

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
      const isSmallScreen = window.innerWidth <= 768
      setIsMobile(isMobileDevice || isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await getBanners()
        if (response.banners && Array.isArray(response.banners)) {
          setBanners(response.banners)
        }
      } catch (error) {
        console.error('Error fetching banners:', error)
      }
    }

    fetchBanners()
  }, [])

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
      }, 5000) // Change banner every 5 seconds

      return () => clearInterval(interval)
    }
  }, [banners.length])

  const handlePurchase = async () => {
    setIsPaymentModalOpen(true)
    // Refresh user balance when opening payment modal
    if (isAuthenticated) {
      try {
        const userResponse = await getCurrentUser()
        if (userResponse.user) {
          setUserBalance(parseFloat(userResponse.user.income || 0))
        }
      } catch (error) {
        console.error('Error fetching user balance:', error)
      }
    }
  }

  const handleQPayPayment = async () => {
    try {
      setIsCreatingInvoice(true)
      setPaymentError(null)
      setPaymentMethod('qpay')

      const response = await createQPayInvoice({
        productId: product.uuid || product.id || productId,
        amount: parseFloat(product.price) || 0,
        description: `Tbarimt.mn - ${product.title}`
      })

      if (response.success && response.invoice) {
        setInvoiceId(response.invoice.invoice_id)
        setQrCode(response.invoice.qr_image || response.invoice.qr_code)
        setQrText(response.invoice.qr_text)
        setQrImageError(false) // Reset error state for new QR code
        setPaymentStatus('pending')
        // Store bank URLs for mobile display
        setBankUrls(response.invoice.urls || [])
        
        // Start polling for payment status
        startPaymentPolling(response.invoice.invoice_id)
      } else {
        throw new Error('Failed to create invoice')
      }
    } catch (error: any) {
      console.error('QPay payment error:', error)
      setPaymentError(error.message || 'QPay төлбөр үүсгэхэд алдаа гарлаа')
      setPaymentMethod(null)
    } finally {
      setIsCreatingInvoice(false)
    }
  }

  const handleWalletPayment = async () => {
    try {
      setIsProcessingWalletPayment(true)
      setPaymentError(null)
      setPaymentMethod(null) // Clear any previous payment method

      const response = await payWithWallet({
        productId: product.uuid || product.id || productId,
        amount: parseFloat(product.price) || 0
      })

      if (response.success && response.downloadToken) {
        // Payment successful
        setDownloadToken({
          token: response.downloadToken.token,
          expiresAt: response.downloadToken.expiresAt
        })
        
        // Update user balance
        if (response.newBalance !== undefined) {
          setUserBalance(response.newBalance)
        }

        // Close payment modal and show download modal
        setIsPaymentModalOpen(false)
        setPaymentMethod(null)
        setIsDownloadModalOpen(true)
      } else {
        throw new Error('Wallet payment failed')
      }
    } catch (error: any) {
      console.error('Wallet payment error:', error)
      setPaymentError(error.message || 'Хэтэвчээр төлбөр төлөхөд алдаа гарлаа')
    } finally {
      setIsProcessingWalletPayment(false)
    }
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
            
            // Capture download token if available
            if (response.downloadToken && response.downloadToken.token) {
              setDownloadToken({
                token: response.downloadToken.token,
                expiresAt: response.downloadToken.expiresAt
              })
            } else {
              // If token not available, try to get it from order
              // Retry a few times to get the token
              let retries = 0
              const maxRetries = 5
              const tokenCheckInterval = setInterval(async () => {
                try {
                  const orderResponse = await checkQPayPaymentStatus(invoiceId)
                  if (orderResponse.downloadToken && orderResponse.downloadToken.token) {
                    setDownloadToken({
                      token: orderResponse.downloadToken.token,
                      expiresAt: orderResponse.downloadToken.expiresAt
                    })
                    clearInterval(tokenCheckInterval)
                  } else {
                    retries++
                    if (retries >= maxRetries) {
                      clearInterval(tokenCheckInterval)
                    }
                  }
                } catch (error) {
                  console.error('Token check error:', error)
                  retries++
                  if (retries >= maxRetries) {
                    clearInterval(tokenCheckInterval)
                  }
                }
              }, 1000)
            }
            
            // Close payment modal after 2 seconds and show download modal
            setTimeout(() => {
              setIsPaymentModalOpen(false)
              setPaymentMethod(null)
              setQrCode(null)
              setQrText(null)
              setQrImageError(false)
              setInvoiceId(null)
              setPaymentStatus(null)
              setBankUrls([])
              
              // Always show download modal - token will be available soon
              setIsDownloadModalOpen(true)
            }, 2000)
          }
        }
      } catch (error) {
        console.error('Payment check error:', error)
      }
    }, 3000)
  }

  const formatDate = (dateString: string | number) => {
    if (!dateString) return '--';
  
    const date = new Date(dateString);
  
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };
  

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (paymentCheckInterval.current) {
        clearInterval(paymentCheckInterval.current)
      }
    }
  }, [])

  const formatNumber = (num: number) => {
    return num.toLocaleString('mn-MN')
  }

  const formatFileType = (fileType: string | null | undefined): string => {
    if (!fileType) return 'N/A'
    
    // If it's already a simple extension like "PDF", "DOCX", etc., return as is
    if (/^[A-Z0-9]+$/i.test(fileType) && fileType.length <= 5) {
      return fileType.toUpperCase()
    }
    
    // Map common MIME types to file extensions
    const mimeToExtension: { [key: string]: string } = {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/pdf': 'pdf',
      'application/zip': 'zip',
      'application/x-rar-compressed': 'rar',
      'application/x-7z-compressed': '7z',
      'text/plain': 'txt',
      'text/csv': 'csv',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'application/x-msdownload': 'exe',
      'application/x-executable': 'exe',
    }
    
    // Check if it's a MIME type and convert it
    const lowerFileType = fileType.toLowerCase()
    if (mimeToExtension[lowerFileType]) {
      return mimeToExtension[lowerFileType].toUpperCase()
    }
    
    // If it contains a slash (likely a MIME type), try to extract extension
    if (fileType.includes('/')) {
      // Try to extract from common patterns
      const patterns = [
        /spreadsheetml\.sheet/i,
        /wordprocessingml\.document/i,
        /presentationml\.presentation/i,
        /ms-excel/i,
        /msword/i,
        /ms-powerpoint/i,
      ]
      
      if (patterns.some(p => p.test(fileType))) {
        if (/spreadsheetml|ms-excel/i.test(fileType)) {
          return fileType.includes('openxml') ? 'XLSX' : 'XLS'
        }
        if (/wordprocessingml|msword/i.test(fileType)) {
          return fileType.includes('openxml') ? 'DOCX' : 'DOC'
        }
        if (/presentationml|ms-powerpoint/i.test(fileType)) {
          return fileType.includes('openxml') ? 'PPTX' : 'PPT'
        }
      }
      
      // Extract from MIME type (e.g., "application/pdf" -> "pdf")
      const parts = fileType.split('/')
      if (parts.length === 2) {
        const subtype = parts[1]
        // Remove common prefixes
        const cleanSubtype = subtype
          .replace(/^vnd\./, '')
          .replace(/^x-/, '')
          .replace(/^officedocument\./, '')
          .replace(/^openxmlformats-officedocument\./, '')
          .replace(/spreadsheetml\.sheet/, 'xlsx')
          .replace(/wordprocessingml\.document/, 'docx')
          .replace(/presentationml\.presentation/, 'pptx')
        
        // If it's a simple extension-like string, return it
        if (/^[a-z0-9]+$/i.test(cleanSubtype) && cleanSubtype.length <= 5) {
          return cleanSubtype.toUpperCase()
        }
      }
    }
    
    // Return as is if we can't determine
    return fileType
  }

  const getDownloadUrl = (token: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    return `${apiBaseUrl}/products/download/${token}`
  }

  const handleDownload = () => {
    if (downloadToken) {
      const downloadUrl = getDownloadUrl(downloadToken.token)
      // Open download in new tab/window
      const downloadWindow = window.open(downloadUrl, '_blank')
      
      // Mark as downloaded and show thank you message
      setIsDownloaded(true)
      
      // Close modal after 3 seconds to show thank you
      setTimeout(() => {
        setIsDownloadModalOpen(false)
        setIsDownloaded(false)
        setDownloadToken(null)
      }, 3000)
    }
  }

  const copyDownloadLink = () => {
    if (downloadToken) {
      const downloadUrl = getDownloadUrl(downloadToken.token)
      navigator.clipboard.writeText(downloadUrl).then(() => {
        alert('Холбоос хуулагдлаа!')
      }).catch(() => {
        alert('Холбоос хуулахад алдаа гарлаа')
      })
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    
    if (diff <= 0) return 'Хугацаа дууссан'
    
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    return `${minutes} минут ${seconds} секунд`
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

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Бүтээгдэхүүн олдсонгүй
          </h2>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Нүүр хуудас руу буцах
          </button>
        </div>
      </div>
    )
  }

  // Generate random placeholder images
  const generatePlaceholderImages = (count: number = 3): string[] => {
    // Use product ID or UUID to generate consistent random images
    const seed = product.id || product.uuid || productId || Math.random().toString(36).substring(7);
    const images: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Use Picsum Photos with seed for consistent random images
      const imageSeed = `${seed}-${i}`;
      images.push(`https://picsum.photos/seed/${imageSeed}/800/500`);
    }
    
    return images;
  };

  // Ensure previewImages is always an array
  const getPreviewImages = () => {
    if (!product.previewImages) {
      // If no preview images and no main image, return random placeholders
      if (!product.image) {
        return generatePlaceholderImages(3);
      }
      return [product.image];
    }
    
    // If it's already an array, return it (filter out empty values)
    if (Array.isArray(product.previewImages)) {
      const filtered = product.previewImages.filter(Boolean);
      // If array is empty, return random placeholders
      if (filtered.length === 0) {
        return generatePlaceholderImages(3);
      }
      return filtered;
    }
    
    // If it's a string, try to parse it
    if (typeof product.previewImages === 'string') {
      try {
        const parsed = JSON.parse(product.previewImages);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(Boolean);
          // If array is empty, return random placeholders
          if (filtered.length === 0) {
            return generatePlaceholderImages(3);
          }
          return filtered;
        }
      } catch (e) {
        console.error('Error parsing previewImages:', e);
      }
    }
    
    // Fallback to main image or random placeholders
    if (product.image) {
      return [product.image];
    }
    
    return generatePlaceholderImages(3);
  };
  
  const previewImages = getPreviewImages();
  const author = product.author || {}

  // Get avatar URL with DiceBear SVG fallback
  const getAvatarUrl = () => {
    if (author.avatar) {
      return author.avatar;
    }
    const seed = author.fullName || author.email || author.username || author.id || 'default';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  };

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
              Контент Дэлгүүр
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Banner Slider */}
            {banners.length > 0 && (
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                  {banners.map((banner, index) => (
                    <div
                      key={banner.id}
                      className={`absolute inset-0 transition-opacity duration-500 ${
                        index === currentBannerIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {banner.linkUrl ? (
                        <a
                          href={banner.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full h-full"
                        >
                          <img
                            src={banner.imageUrl}
                            alt={banner.title || 'Banner'}
                            className="w-full h-full object-cover cursor-pointer"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </a>
                      ) : (
                        <img
                          src={banner.imageUrl}
                          alt={banner.title || 'Banner'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  ))}
                  
                  {/* Banner Navigation Dots */}
                  {banners.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                      {banners.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentBannerIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentBannerIndex
                              ? 'bg-white w-8'
                              : 'bg-white/50 hover:bg-white/75'
                          }`}
                          aria-label={`Go to banner ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Banner Navigation Arrows */}
                  {banners.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white p-2 rounded-full shadow-lg transition-all z-10"
                        aria-label="Previous banner"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white p-2 rounded-full shadow-lg transition-all z-10"
                        aria-label="Next banner"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Main Image */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                <img
                  src={previewImages[selectedImageIndex] || previewImages[0] || product.image || '/placeholder.png'}
                  alt={product.title}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setIsImageModalOpen(true)}
                />
                {product.isDiploma && (
                  <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg font-bold shadow-lg">
                    🎓 Дипломын ажил
                  </div>
                )}
                <div className="absolute top-4 right-4 flex items-center space-x-1 bg-white/90 dark:bg-gray-800/90 px-3 py-1.5 rounded-full shadow-lg">
                  <span className="text-yellow-400 text-lg">⭐</span>
                  <span className="font-bold text-gray-900 dark:text-white">{parseFloat(product.rating) || 0}</span>
                </div>
              </div>
              
              {/* Thumbnail Images */}
              {previewImages && previewImages.length > 1 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900">
                  <div className="flex space-x-3 overflow-x-auto">
                    {previewImages.map((img: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index
                            ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-1">
                  <span className="text-xl">👁️</span>
                  <span className="text-sm font-medium">Нийт үзсэн</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(product.views || 0)}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-1">
                <span className="text-xl">🕒</span>
                <span className="text-sm font-medium">Үүссэн огноо</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatDate(product.createdAt)}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-1">
                  <span className="text-xl">⭐</span>
                  <span className="text-sm font-medium">Үнэлгээ</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {parseFloat(product.rating) || 0}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Дэлгэрэнгүй мэдээлэл
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {product.description || 'Тайлбар байхгүй байна.'}
              </p>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {(product.tags || []).map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Author Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Зохиогч
              </h3>
              <div className="flex items-center space-x-4">
                <img
                  src={getAvatarUrl()}
                  alt={author.fullName || author.username || 'Author'}
                  className="w-16 h-16 rounded-full border-2 border-blue-500 dark:border-blue-400"
                  onError={(e) => {
                    // Fallback to DiceBear if image fails to load
                    const seed = author.fullName || author.email || author.username || author.id || 'default';
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
                  }}
                />
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                    {author.fullName || author.username || 'Unknown'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    @{author.username || 'unknown'}
                  </p>
                  {author.journalist && (
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-yellow-400">⭐</span>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {parseFloat(author.journalist.rating) || 0}
                      </span>
                    </div>
                  )}
                </div>
                {author.id && (
                  <button 
                    onClick={() => router.push(`/journalist/${author.id}`)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md"
                  >
                    Профайл үзэх
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Purchase Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {product.title}
              </h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Ангилал:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {typeof product.category === 'object' && product.category?.name
                      ? product.category.name
                      : typeof product.category === 'string'
                      ? product.category
                      : 'N/A'}
                  </span>
                </div>
                {product.pages && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Хуудас:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {product.pages} хуудас
                    </span>
                  </div>
                )}
                {product.size && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Хэмжээ:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {product.fileSize}
                    </span>
                  </div>
                )}
                {product.fileType && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Файлын төрөл:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatFileType(product.fileType)}
                    </span>
                  </div>
                )}
                {product.createdAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Огноо:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Date(product.createdAt).toLocaleDateString('mn-MN')}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg text-gray-600 dark:text-gray-400">Үнэ:</span>
                  <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {formatNumber(parseFloat(product.price) || 0)}₮
                  </span>
                </div>
              </div>

              <button
                onClick={handlePurchase}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 mb-4"
              >
                🛒 Одоо худалдаж авах
              </button>

              <button className="w-full border-2 border-blue-600 text-blue-600 dark:text-blue-400 py-3 rounded-xl font-semibold hover:bg-blue-50 dark:hover:bg-gray-700 transition-all">
                ❤️ Хүслийн жагсаалтад нэмэх
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-5xl w-full">
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-10"
            >
              ×
            </button>
            <img
              src={previewImages[selectedImageIndex] || previewImages[0] || product.image || '/placeholder.png'}
              alt={product.title}
              className="w-full h-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {previewImages && previewImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {previewImages.map((img: string, index: number) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedImageIndex(index)
                    }}
                    className={`w-3 h-3 rounded-full transition-all ${
                      selectedImageIndex === index
                        ? 'bg-white'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsPaymentModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Төлбөр төлөх
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              {paymentError && !paymentMethod && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <p className="text-red-800 dark:text-red-200 text-sm">{paymentError}</p>
                </div>
              )}
              {!paymentMethod && (
                <>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Бүтээгдэхүүн:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {product.title}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-600 dark:text-gray-400">Нийт дүн:</span>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatNumber(parseFloat(product.price) || 0)}₮
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {isAuthenticated && (
                      <button
                        onClick={handleWalletPayment}
                        disabled={isProcessingWalletPayment || userBalance < parseFloat(product.price || 0)}
                        className={`w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed ${
                          userBalance < parseFloat(product.price || 0) 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:from-purple-700 hover:to-indigo-700'
                        }`}
                      >
                        {isProcessingWalletPayment ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Төлбөр төлж байна...</span>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl">👛</span>
                            <span>Хэтэвчээр худалдаж авах</span>
                          </>
                        )}
                      </button>
                    )}

                    {isAuthenticated && userBalance < parseFloat(product.price || 0) && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200">
                        <p>⚠️ Таны үлдэгдэл хангалтгүй байна. Одоогийн үлдэгдэл: <span className="font-semibold">{formatNumber(userBalance)}₮</span></p>
                      </div>
                    )}

                    <button
                      onClick={handleQPayPayment}
                      disabled={isCreatingInvoice}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingInvoice ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Бэлдэж байна...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl">💳</span>
                          <span>QPay төлбөр төлөх</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setPaymentMethod('bank')
                        alert('Банкны шилжүүлэгт шилжиж байна...')
                      }}
                      className="w-full border-2 border-blue-600 text-blue-600 dark:text-blue-400 py-3 rounded-xl font-semibold hover:bg-blue-50 dark:hover:bg-gray-700 transition-all"
                    >
                      🏦 Банкны шилжүүлэг
                    </button>
                  </div>
                </>
              )}

              {paymentMethod === 'qpay' && (
                <div className="space-y-4">
                  {paymentError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <p className="text-red-800 dark:text-red-200 text-sm">{paymentError}</p>
                      <button
                        onClick={() => {
                          setPaymentError(null)
                          setPaymentMethod(null)
                          setQrCode(null)
                          setQrText(null)
                          setQrImageError(false)
                          setInvoiceId(null)
                          setBankUrls([])
                        }}
                        className="mt-2 text-red-600 dark:text-red-400 text-sm underline"
                      >
                        Буцах
                      </button>
                    </div>
                  )}

                  {(qrCode || qrText) && !paymentError && (
                    <>
                      <div className="text-center">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          QPay QR код уншуулах
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          QPay апп-аар QR кодыг уншуулж төлбөрөө төлнө үү
                        </p>
                        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg inline-block">
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

                        {/* Bank App Icons - Only show on mobile */}
                        {isMobile && bankUrls && bankUrls.length > 0 && (
                          <div className="mt-6">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                              Банкны апп-аар төлөх:
                            </p>
                            <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                              {bankUrls.map((bank, index) => {
                                const handleBankClick = () => {
                                  // Try to open deep link - this will open the app if installed
                                  // For mobile browsers, this is the standard way to open deep links
                                  try {
                                    // Use window.location for better compatibility
                                    window.location.href = bank.link
                                  } catch (error) {
                                    console.error('Failed to open bank app:', error)
                                    // Fallback: try opening in new window/tab
                                    window.open(bank.link, '_blank')
                                  }
                                }

                                return (
                                  <button
                                    key={index}
                                    onClick={handleBankClick}
                                    className="flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all active:scale-95"
                                    title={bank.description || bank.name}
                                  >
                                  <img
                                    src={bank.logo}
                                    alt={bank.name}
                                    className="w-12 h-12 object-contain mb-2"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.style.display = 'none'
                                    }}
                                  />
                                  <span className="text-xs text-gray-600 dark:text-gray-400 text-center line-clamp-2">
                                    {bank.name}
                                  </span>
                                </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {paymentStatus === 'paid' ? (
                              <span className="text-2xl">✅</span>
                            ) : (
                              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                              {paymentStatus === 'paid' 
                                ? 'Төлбөр амжилттай төлөгдлөө!' 
                                : 'Төлбөрийн статусыг шалгаж байна...'}
                            </p>
                            {paymentStatus === 'pending' && (
                              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                Төлбөр төлсний дараа автоматаар шинэчлэгдэнэ
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (paymentCheckInterval.current) {
                            clearInterval(paymentCheckInterval.current)
                            paymentCheckInterval.current = null
                          }
                          setIsPaymentModalOpen(false)
                          setPaymentMethod(null)
                          setQrCode(null)
                          setQrText(null)
                          setQrImageError(false)
                          setInvoiceId(null)
                          setPaymentStatus(null)
                          setBankUrls([])
                        }}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                      >
                        Цуцлах
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Төлбөр төлсний дараа файлыг татаж авах боломжтой болно
            </div>
          </div>
        </div>
      )}

      {/* Download Modal */}
      {isDownloadModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            if (!isDownloaded) {
              setIsDownloadModalOpen(false)
              setIsDownloaded(false)
              setDownloadToken(null)
            }
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {isDownloaded ? (
              // Thank you message after download
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🙏</div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Баярлалаа!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Татаж авалт амжилттай боллоо. Амжилт хүсье!
                </p>
                <button
                  onClick={() => {
                    setIsDownloadModalOpen(false)
                    setIsDownloaded(false)
                    setDownloadToken(null)
                  }}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  Хаах
                </button>
              </div>
            ) : downloadToken ? (
              // Download modal with token
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    ✅ Төлбөр амжилттай!
                  </h3>
                  <button
                    onClick={() => {
                      setIsDownloadModalOpen(false)
                      setDownloadToken(null)
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-green-800 dark:text-green-200 font-semibold mb-2">
                      🎉 Төлбөр амжилттай төлөгдлөө!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Одоо та файлыг татаж авах боломжтой.
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                      ⏰ Хугацаа дуусах хугацаа:
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {getTimeRemaining(downloadToken.expiresAt)}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      Энэ холбоос нь 10 минутын дараа эсвэл нэг удаа татаж авсны дараа хүчингүй болно.
                    </p>
                  </div>

                  

                  <div className="space-y-3">
                    <button
                      onClick={handleDownload}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg flex items-center justify-center space-x-3"
                    >
                      <span className="text-2xl">⬇️</span>
                      <span>Файл татаж авах</span>
                    </button>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      ⚠️ Анхаар: Энэ холбоос нь зөвхөн нэг удаа ашиглах боломжтой. Хугацаа дуусахаас өмнө татаж авахыг зөвлөж байна.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              // Loading state while waiting for token
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  ✅ Төлбөр амжилттай!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Татаж авах холбоос бэлдэж байна...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

