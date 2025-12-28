'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { getProductById, getBanners, createQPayInvoice, checkQPayPaymentStatus, getOrderByInvoice } from '@/lib/api'

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
  const paymentCheckInterval = useRef<NodeJS.Timeout | null>(null)

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

  const handlePurchase = () => {
    setIsPaymentModalOpen(true)
  }

  const handleQPayPayment = async () => {
    try {
      setIsCreatingInvoice(true)
      setPaymentError(null)
      setPaymentMethod('qpay')

      const response = await createQPayInvoice({
        productId: product.id || productId,
        amount: parseFloat(product.price) || 0,
        description: `Tbarimt.mn - ${product.title}`
      })

      if (response.success && response.invoice) {
        setInvoiceId(response.invoice.invoice_id)
        setQrCode(response.invoice.qr_image || response.invoice.qr_code)
        setQrText(response.invoice.qr_text)
        setQrImageError(false) // Reset error state for new QR code
        setPaymentStatus('pending')
        
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
            // Close modal after 2 seconds and show success
            setTimeout(() => {
              setIsPaymentModalOpen(false)
              setPaymentMethod(null)
              setQrCode(null)
              setQrText(null)
              setQrImageError(false)
              setInvoiceId(null)
              setPaymentStatus(null)
              alert('Төлбөр амжилттай төлөгдлөө!')
            }, 2000)
          }
        }
      } catch (error) {
        console.error('Payment check error:', error)
      }
    }, 3000)
  }

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

  const previewImages = product.previewImages || [product.image].filter(Boolean)
  const author = product.author || {}

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
                  src={previewImages[selectedImageIndex] || product.image || '/placeholder.png'}
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
                  <span className="text-xl">⬇️</span>
                  <span className="text-sm font-medium">Татсан тоо</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(product.downloads || 0)}
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
                  src={author.avatar || '/placeholder.png'}
                  alt={author.fullName || author.username || 'Author'}
                  className="w-16 h-16 rounded-full border-2 border-blue-500 dark:border-blue-400"
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
                      {product.size}
                    </span>
                  </div>
                )}
                {product.fileType && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Файлын төрөл:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {product.fileType}
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
              src={previewImages[selectedImageIndex] || product.image || '/placeholder.png'}
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
    </div>
  )
}

