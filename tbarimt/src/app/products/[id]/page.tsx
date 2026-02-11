'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { getProductById, getBanners, createQPayInvoice, checkQPayPaymentStatus, getOrderByInvoice, payWithWallet, getCurrentUser, createCopyrightReport, getRecommendedProducts, createSimilarFileRequest } from '@/lib/api'
import WishlistHeartIcon from '@/components/WishlistHeartIcon'
import AuthModal from '@/components/AuthModal'

export const dynamic = 'force-dynamic'

export default function ProductDetail() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'qpay' | 'bank' | null>(null)
  const [product, setProduct] = useState<any>(null)
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
  const [userPhone, setUserPhone] = useState<string>('')
  const [isProcessingWalletPayment, setIsProcessingWalletPayment] = useState(false)
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false)
  const [isCopyrightReportModalOpen, setIsCopyrightReportModalOpen] = useState(false)
  const [copyrightReportComment, setCopyrightReportComment] = useState('')
  const [copyrightReportPhone, setCopyrightReportPhone] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [reportSuccess, setReportSuccess] = useState(false)
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([])
  const [loadingRecommended, setLoadingRecommended] = useState(false)
  const [isSimilarFileRequestModalOpen, setIsSimilarFileRequestModalOpen] = useState(false)
  const [similarFileRequestDescription, setSimilarFileRequestDescription] = useState('')
  const [isSubmittingSimilarFileRequest, setIsSubmittingSimilarFileRequest] = useState(false)
  const [similarFileRequestError, setSimilarFileRequestError] = useState<string | null>(null)
  const [similarFileRequestSuccess, setSimilarFileRequestSuccess] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

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

  // Set dynamic meta tags for social sharing
  useEffect(() => {
    if (!product || typeof window === 'undefined') return

    const getAbsoluteUrl = (url: string) => {
      if (!url) return ''
      // If already absolute, return as is
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
      }
      // If relative, make it absolute
      const origin = window.location.origin
      // Handle URLs that start with / and those that don't
      if (url.startsWith('/')) {
        return `${origin}${url}`
      }
      return `${origin}/${url}`
    }

    const url = window.location.href
    
    const title = `${product.title} - Tbarimt.mn`
    const description = product.description 
      ? product.description.substring(0, 300).replace(/<[^>]*>/g, '').trim() // Remove HTML tags, limit to 300 chars
      : `${product.title} - ${formatNumber(parseFloat(product.price) || 0)}₮ - Tbarimt.mn`
    
    // Ensure image URL is absolute - use product image or fallback
    let image = product.image || '/tbarimt.jpeg'
    image = getAbsoluteUrl(image)

    // Set or update meta tags
    const setMetaTag = (property: string, content: string) => {
      if (!content) return
      let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute('property', property)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    const setMetaName = (name: string, content: string) => {
      if (!content) return
      let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute('name', name)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    // Open Graph tags (Facebook requires these) - MUST be set for Facebook to see them
    setMetaTag('og:title', title)
    setMetaTag('og:description', description)
    setMetaTag('og:image', image)
    setMetaTag('og:image:width', '1200')
    setMetaTag('og:image:height', '630')
    setMetaTag('og:image:type', 'image/jpeg')
    setMetaTag('og:url', url)
    setMetaTag('og:type', 'website')
    setMetaTag('og:site_name', 'Tbarimt.mn')
    setMetaTag('og:locale', 'mn_MN')

    // Twitter Card tags
    setMetaName('twitter:card', 'summary_large_image')
    setMetaName('twitter:title', title)
    setMetaName('twitter:description', description)
    setMetaName('twitter:image', image)
    setMetaName('twitter:site', '@tbarimt')

    // Standard meta tags
    const titleElement = document.querySelector('title')
    if (titleElement) {
      titleElement.textContent = title
    } else {
      const newTitle = document.createElement('title')
      newTitle.textContent = title
      document.head.appendChild(newTitle)
    }

    setMetaName('description', description)

    console.log('Meta tags set:', { title, description, image, url })
  }, [product])

  // Fetch recommended products
  useEffect(() => {
    const fetchRecommended = async () => {
      if (!productId) return
      
      try {
        setLoadingRecommended(true)
        const response = await getRecommendedProducts(productId, 8)
        if (response.products && Array.isArray(response.products)) {
          setRecommendedProducts(response.products)
        }
      } catch (error) {
        console.error('Error fetching recommended products:', error)
      } finally {
        setLoadingRecommended(false)
      }
    }

    if (productId) {
      fetchRecommended()
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
            setUserPhone(userResponse.user.phone || '')
          }
        }
      } catch (error) {
        // User not authenticated or error
        setIsAuthenticated(false)
        setUserBalance(0)
        setUserPhone('')
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

  const handleShareFacebook = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!product) return;
  
    if (typeof window === 'undefined') return;
  
    // Current page URL - use the exact URL that matches the metadata
    let url = window.location.href;
    
    // Ensure URL uses UUID if available (matches the page URL format)
    // This ensures Facebook sees the same URL as in the meta tags
    if (product.uuid && !url.includes(product.uuid)) {
      // If URL uses ID but product has UUID, we should use UUID
      // But since we're already on the page, just use current URL
      url = window.location.href;
    }
  
    // Facebook Share URL
    // Note: If preview doesn't show, use Facebook Sharing Debugger:
    // https://developers.facebook.com/tools/debug/
    // to clear Facebook's cache
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  
    // Open Facebook Share Dialog in a new small window
    window.open(
      shareUrl,
      'fb-share-dialog',
      'width=626,height=436,scrollbars=no,resizable=no,noopener,noreferrer'
    );
  };
  
  
  const handleShareX = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!product) return;
    
    const url = window.location.href;
    const text = `${product.title} - ${formatNumber(parseFloat(product.price) || 0)}₮`;
    const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(shareUrl, 'twitter-share', 'width=626,height=436');
  }

  const handleCopyLink = async () => {
    if (!product) return
    
    const url = typeof window !== 'undefined' 
      ? window.location.origin + window.location.pathname + window.location.search
      : ''
    
    if (!url) {
      alert('URL олдсонгүй')
      return
    }
    
    try {
      await navigator.clipboard.writeText(url)
      alert('Холбоос хуулагдлаа!')
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        alert('Холбоос хуулагдлаа!')
      } catch (err) {
        alert('Холбоос хуулахад алдаа гарлаа')
      }
      document.body.removeChild(textArea)
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

  // Generate random placeholder images
  const generatePlaceholderImages = (count: number = 3): string[] => {
    // Use product ID or UUID to generate consistent random images
    const seed = product?.id || product?.uuid || productId || Math.random().toString(36).substring(7);
    const images: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Use Picsum Photos with seed for consistent random images
      const imageSeed = `${seed}-${i}`;
      images.push(`https://picsum.photos/seed/${imageSeed}/800/500`);
    }
    
    return images;
  };

  // Check if product has admin-created previewImages
  const hasPreviewImages = () => {
    if (!product || !product.previewImages) return false;
    
    // If it's already an array, filter out empty values
    if (Array.isArray(product.previewImages)) {
      const filtered = product.previewImages.filter(Boolean);
      return filtered.length > 0;
    } else if (typeof product.previewImages === 'string') {
      // If it's a string, try to parse it
      try {
        const parsed = JSON.parse(product.previewImages);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(Boolean);
          return filtered.length > 0;
        }
      } catch (e) {
        console.error('Error parsing previewImages:', e);
      }
    }
    
    return false;
  };

  // Ensure previewImages is always an array
  // Priority: admin-created previewImages > product.image > placeholders
  const getPreviewImages = () => {
    if (!product) return [];
    
    // Check if admin created previewImages
    let adminPreviewImages: string[] | null = null;
    
    if (product.previewImages) {
      // If it's already an array, filter out empty values
      if (Array.isArray(product.previewImages)) {
        const filtered = product.previewImages.filter(Boolean);
        if (filtered.length > 0) {
          adminPreviewImages = filtered;
        }
      } else if (typeof product.previewImages === 'string') {
        // If it's a string, try to parse it
        try {
          const parsed = JSON.parse(product.previewImages);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(Boolean);
            if (filtered.length > 0) {
              adminPreviewImages = filtered;
            }
          }
        } catch (e) {
          console.error('Error parsing previewImages:', e);
        }
      }
    }
    
    // If admin created previewImages, use them
    if (adminPreviewImages && adminPreviewImages.length > 0) {
      return adminPreviewImages;
    }
    
    // Otherwise, use product.image if it exists
    if (product.image) {
      return [product.image];
    }
    
    // Last resort: generate placeholders
    return generatePlaceholderImages(3);
  };
  
  const previewImages = getPreviewImages();

  // Keyboard navigation for image modal
  useEffect(() => {
    if (!isImageModalOpen || !previewImages || previewImages.length <= 1) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setSelectedImageIndex((prev) => 
          prev === 0 ? previewImages.length - 1 : prev - 1
        )
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setSelectedImageIndex((prev) => 
          prev === previewImages.length - 1 ? 0 : prev + 1
        )
      } else if (e.key === 'Escape') {
        setIsImageModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isImageModalOpen, previewImages])

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
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
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

  const author = product.author || {}

  // Get avatar URL with DiceBear SVG fallback
  const getAvatarUrl = () => {
    if (author.avatar) {
      return author.avatar;
    }
    const seed = author.fullName || author.email || author.username || author.id || 'default';
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;
  };

  // Get membership name for badge display
  const getMembershipName = () => {
    const membershipName = author.membership?.name || '';
    if (membershipName) {
      // Extract the membership tier name (e.g., "GOLD", "SILVER", "BRONZE", "FREE", "PLATINUM")
      const upperName = membershipName.toUpperCase();
      if (upperName.includes('PLATINUM')) return 'PLATINUM';
      if (upperName.includes('GOLD')) return 'GOLD';
      if (upperName.includes('SILVER')) return 'SILVER';
      if (upperName.includes('BRONZE')) return 'BRONZE';
      if (upperName.includes('FREE')) return 'FREE';
      return membershipName.toUpperCase();
    }
    return 'FREE';
  };

  // Determine membership type and get decoration styles
  const getMembershipDecoration = () => {
    // Check if author has membership information
    const membershipName = author.membership?.name || '';
    
    // Determine membership type based on name only (no static IDs)
    let membershipType = 'FREE';
    
    if (membershipName) {
      const upperName = membershipName.toUpperCase();
      if (upperName.includes('PLATINUM')) {
        membershipType = 'PLATINUM';
      } else if (upperName.includes('GOLD')) {
        membershipType = 'GOLD';
      } else if (upperName.includes('SILVER')) {
        membershipType = 'SILVER';
      } else if (upperName.includes('BRONZE')) {
        membershipType = 'BRONZE';
      } else if (upperName.includes('FREE')) {
        membershipType = 'FREE';
      }
    }

    // Return decoration styles based on membership type
    switch (membershipType) {
      case 'SILVER':
        return {
          borderGradient: 'from-gray-300 via-slate-400 to-gray-300',
          glowColor: 'rgba(192, 192, 192, 0.6)',
          ringColor: 'ring-slate-400',
          shadowColor: 'shadow-slate-500/50',
          pulseColor: 'bg-slate-400',
          badgeColor: 'bg-slate-500 text-white'
        };
      case 'GOLD':
        return {
          borderGradient: 'from-yellow-400 via-amber-500 to-yellow-400',
          glowColor: 'rgba(251, 191, 36, 0.7)',
          ringColor: 'ring-yellow-400',
          shadowColor: 'shadow-yellow-500/60',
          pulseColor: 'bg-yellow-400',
          badgeColor: 'bg-yellow-500 text-white'
        };
      case 'PLATINUM':
        return {
          borderGradient: 'from-cyan-300 via-blue-400 via-indigo-400 to-cyan-300',
          glowColor: 'rgba(59, 130, 246, 0.7)',
          ringColor: 'ring-cyan-400',
          shadowColor: 'shadow-cyan-500/60',
          pulseColor: 'bg-cyan-400',
          badgeColor: 'bg-cyan-500 text-white'
        };
      case 'BRONZE':
        return {
          borderGradient: 'from-orange-300 via-orange-500 to-orange-300',
          glowColor: 'rgba(251, 146, 60, 0.7)',
          ringColor: 'ring-orange-400',
          shadowColor: 'shadow-orange-500/60',
          pulseColor: 'bg-orange-400',
          badgeColor: 'bg-orange-600 text-white'
        };
      default: // FREE
        return {
          borderGradient: 'from-gray-200 via-gray-300 to-gray-200',
          glowColor: 'rgba(156, 163, 175, 0.4)',
          ringColor: 'ring-gray-400',
          shadowColor: 'shadow-gray-400/40',
          pulseColor: 'bg-gray-400',
          badgeColor: 'bg-gray-500 text-white'
        };
    }
  };

  const membershipDeco = getMembershipDecoration();
  const membershipName = getMembershipName();

  return (
    <>
      {/* CSS Animations for Membership Decorations */}
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes float-particle {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
            opacity: 0.4; 
          }
          25% { 
            transform: translate(8px, -10px) scale(1.3); 
            opacity: 0.8; 
          }
          50% { 
            transform: translate(-8px, 10px) scale(1.1); 
            opacity: 1; 
          }
          75% { 
            transform: translate(10px, 8px) scale(1.2); 
            opacity: 0.7; 
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            opacity: 0.6;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.05);
          }
        }
        
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
        }
        
        @keyframes star-rotate {
          from {
            transform: rotate(0deg) translateX(45px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(45px) rotate(-360deg);
          }
        }
        
        @keyframes border-pulse {
          0%, 100% {
            border-width: 2px;
            box-shadow: 0 0 20px currentColor, 0 0 40px currentColor;
          }
          50% {
            border-width: 3px;
            box-shadow: 0 0 30px currentColor, 0 0 60px currentColor, 0 0 80px currentColor;
          }
        }
      `}</style>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Буцах</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Контент Дэлгүүр
            </h1>
            <div className="flex items-center space-x-3">
              <button className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images and Preview */}
          <div className="lg:col-span-2 space-y-4">
            {/* Banner Slider */}
            {banners.length > 0 && (
              <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="relative aspect-video">
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
                          className={`h-1.5 rounded-full transition-all ${
                            index === currentBannerIndex
                              ? 'bg-white w-8'
                              : 'bg-white/50 hover:bg-white/75 w-1.5'
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
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white p-2 rounded-full shadow-md transition-all z-10"
                        aria-label="Previous banner"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white p-2 rounded-full shadow-md transition-all z-10"
                        aria-label="Next banner"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Main Image with Share Buttons Overlay */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="relative aspect-[8/3] bg-gray-100 dark:bg-gray-700">
                <img
                  src={product.image || '/placeholder.png'}
                  alt={product.title}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setIsImageModalOpen(true)}
                />
                {product.isDiploma && (
                  <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md z-10">
                    🎓 Дипломын ажил
                  </div>
                )}
                
                {/* Share Buttons - Top Right Corner */}
                <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
                  <button
                    onClick={handleShareFacebook}
                    className="w-10 h-10 flex items-center justify-center bg-[#1877F2] text-white rounded-full shadow-lg hover:bg-[#166FE5] transition-all hover:scale-105"
                    aria-label="Facebook дээр хуваалцах"
                    title="Facebook дээр хуваалцах"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                  <button
                    onClick={handleShareX}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:scale-105"
                    aria-label="X (Twitter) дээр хуваалцах"
                    title="X (Twitter) дээр хуваалцах"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-xs font-medium">Нийт үзсэн</span>
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatNumber(product.views || 0)}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-medium">Үүссэн огноо</span>
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDate(product.createdAt)}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs font-medium">Үнэлгээ</span>
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {parseFloat(product.rating) || 0}
                </div>
              </div>
            </div>

            {/* Preview Images Horizontal List */}
            {hasPreviewImages() && previewImages && previewImages.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Зургийн цомог
                </h3>
                <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                  {previewImages.map((img: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedImageIndex(index)
                        setIsImageModalOpen(true)
                      }}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 ${
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

            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                Дэлгэрэнгүй мэдээлэл
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {product.description || 'Тайлбар байхгүй байна.'}
              </p>
              
              {/* Tags */}
              {(product.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {(product.tags || []).map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Purchase Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700 sticky top-24">
              <div className="flex items-start justify-between mb-5">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white flex-1 pr-3 leading-tight">
                  {product.title}
                </h2>
                <div className="flex-shrink-0">
                  <WishlistHeartIcon 
                    productId={product.uuid || product.id} 
                    size="lg"
                  />
                </div>
              </div>
              
              <div className="space-y-3 mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ангилал:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {typeof product.category === 'object' && product.category?.name
                      ? product.category.name
                      : typeof product.category === 'string'
                      ? product.category
                      : 'N/A'}
                  </span>
                </div>
                {product.pages && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Хуудас:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {product.pages} хуудас
                    </span>
                  </div>
                )}
                {product.size && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Хэмжээ:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {product.fileSize}
                    </span>
                  </div>
                )}
                {product.fileType && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Файлын төрөл:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatFileType(product.fileType)}
                    </span>
                  </div>
                )}
                {product.createdAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Огноо:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {new Date(product.createdAt).toLocaleDateString('mn-MN')}
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-5">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(parseFloat(product.price) || 0)}₮
                </div>
              </div>

              <button
                onClick={handlePurchase}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all shadow-sm hover:shadow-md mb-3 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Одоо худалдаж авах</span>
              </button>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    try {
                      sessionStorage.setItem('post_login_redirect', `/products/${productId}`)
                    } catch {
                      // ignore storage errors
                    }
                    setShowAuthModal(true)
                    return
                  }
                  setIsSimilarFileRequestModalOpen(true)
                  setSimilarFileRequestDescription('')
                  setSimilarFileRequestError(null)
                  setSimilarFileRequestSuccess(false)
                }}
                className="w-full flex items-center justify-center bg-purple-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-purple-700 transition-all shadow-sm hover:shadow-md mb-3 space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span>Ижил төстэй файл захиалах</span>
              </button>
           
              <button
                onClick={() => {
                  setIsCopyrightReportModalOpen(true)
                  if (isAuthenticated && userPhone) {
                    setCopyrightReportPhone(userPhone)
                  } else {
                    setCopyrightReportPhone('')
                  }
                }}
                className="w-full flex items-center justify-center border-2 border-red-600 text-red-600 dark:text-red-400 py-3 rounded-lg font-semibold text-sm hover:bg-red-50 dark:hover:bg-gray-700 transition-all space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Зохиогчийн эрхийн мэдгдэл</span>
              </button>

              {/* Author Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700 mt-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase">
                  ЗОХИОГЧ
                </h3>
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-3">
                    {/* Avatar with Membership Badge */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={getAvatarUrl()}
                        alt={author.fullName || author.username || 'Author'}
                        className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-gray-700"
                        onError={(e) => {
                          const seed = author.fullName || author.email || author.username || author.id || 'default';
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;
                        }}
                      />
                      {/* Membership Badge */}
                      <div className={`absolute -bottom-1 -right-1 ${membershipDeco.badgeColor} text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md border-2 border-white dark:border-gray-800 uppercase`}>
                        {membershipName}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {author.fullName || author.username || 'Unknown'}
                      </h4>
                      {author.journalist && (
                        <div className="flex items-center space-x-1 mt-1">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {parseFloat(author.journalist.rating) || 0} үнэлгээ
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {author.id && (
                    <button 
                      onClick={() => router.push(`/journalist/${author.id}`)}
                      className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm font-medium"
                    >
                      Профайл үзэх
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Products Section */}
      {recommendedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-12">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-8">
            Санал болгох контентууд
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recommendedProducts.map((recProduct) => {
              const isUnique = recProduct.isUnique === true;
              return (
                <div
                  key={recProduct.id}
                  className={`rounded-2xl transition-all duration-300 transform hover:-translate-y-3 ${
                    isUnique 
                      ? 'p-0.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 shadow-lg hover:shadow-2xl' 
                      : ''
                  }`}
                >
                  <div
                    onClick={() => router.push(`/products/${recProduct.uuid || recProduct.id}`)}
                    className={`rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer ${
                      isUnique 
                        ? 'bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20' 
                        : 'border-2 border-[#004e6c]/10 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#004e6c]/30 dark:hover:border-gray-600'
                    }`}
                    style={isUnique ? {
                      boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.2), 0 10px 10px -5px rgba(34, 197, 94, 0.05)'
                    } : {}}
                  >
                    {/* Product Image */}
                    <div className={`relative h-48 overflow-hidden ${
                      isUnique 
                        ? 'bg-gradient-to-br from-green-50 dark:from-green-900/20 to-emerald-50 dark:to-emerald-900/20' 
                        : 'bg-gradient-to-br from-[#004e6c]/10 dark:from-gray-700/20 to-[#006b8f]/10 dark:to-gray-600/20'
                    }`}>
                      <img
                        src={recProduct.image || '/placeholder.png'}
                        alt={recProduct.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#004e6c]/20 dark:from-gray-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {/* Unique Badge */}
                      {isUnique && (
                        <div className="absolute top-3 left-3 z-10">
                          <div className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full shadow-lg flex items-center space-x-1 animate-pulse">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs font-bold">UNIQUE</span>
                          </div>
                        </div>
                      )}
                      {/* Star Rating and Wishlist Icon */}
                      <div className={`absolute ${isUnique ? 'top-12 right-4' : 'top-4 right-4'} flex items-center space-x-2`}>
                        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-2 rounded-full shadow-lg">
                          <WishlistHeartIcon 
                            productId={recProduct.uuid || recProduct.id} 
                            size="md"
                          />
                        </div>
                        <div className="flex items-center space-x-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                          <span className="text-yellow-400 text-sm">⭐</span>
                          <span className="text-xs font-bold text-[#004e6c] dark:text-gray-200">
                            {parseFloat(recProduct.rating) || 0}
                          </span>
                        </div>
                      </div>
                      {/* Category Badge */}
                      <div className={`absolute ${isUnique ? 'top-12 left-4' : 'bottom-4 left-4'}`}>
                        <span className="text-xs font-bold text-white bg-[#004e6c] dark:bg-[#006b8f] px-3 py-1.5 rounded-full shadow-lg group-hover:bg-[#ff6b35] dark:group-hover:bg-[#ff8555] transition-colors">
                          {typeof recProduct.category === 'object' && recProduct.category?.name
                            ? recProduct.category.name
                            : typeof recProduct.category === 'string'
                            ? recProduct.category
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className={`text-sm font-semibold mb-3 line-clamp-2 transition-colors min-h-[3rem] ${
                        isUnique 
                          ? 'text-green-900 dark:text-green-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400' 
                          : 'text-[#004e6c] dark:text-gray-200 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555]'
                      }`}>
                        {recProduct.title}
                      </h4>
                      <div className="flex items-center justify-between text-sm text-[#004e6c]/70 dark:text-gray-400 mb-4 font-medium">
                        <span className="flex items-center space-x-2">
                          <span>📄</span>
                          <span>{recProduct.pages ? `${recProduct.pages} хуудас` : recProduct.size || 'N/A'}</span>
                        </span>
                        <span className="flex items-center space-x-2">
                          <span>⬇️</span>
                          <span>{formatNumber(recProduct.downloads || 0)}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t-2 border-[#004e6c]/10 dark:border-gray-700 gap-3">
                        <span className={`text-base font-semibold transition-colors ${
                          isUnique 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-[#004e6c] dark:text-gray-200 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555]'
                        }`}>
                          {formatNumber(parseFloat(recProduct.price) || 0)}₮
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/products/${recProduct.uuid || recProduct.id}`)
                          }}
                          className={`w-10 h-10 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center group ${
                            isUnique
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                              : 'bg-[#004e6c] dark:bg-[#006b8f] text-white hover:bg-[#ff6b35] dark:hover:bg-[#ff8555]'
                          }`}
                          aria-label="Дэлгэрэнгүй"
                        >
                          <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          © 2024 Дижитал Контент Дэлгүүр. Бүх эрх хуулиар хамгаалагдсан.
        </div>
      </footer>

      {/* Image Modal - Gallery Viewer */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 text-white text-xl hover:text-gray-300 z-20 bg-black/50 rounded-full w-10 h-10 flex items-center justify-center transition-all hover:bg-black/70"
            >
              ×
            </button>

            {/* Left Navigation Arrow */}
            {previewImages && previewImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImageIndex((prev) => 
                    prev === 0 ? previewImages.length - 1 : prev - 1
                  )
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full w-12 h-12 flex items-center justify-center z-20 transition-all"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Main Image */}
            <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
              <img
                src={previewImages[selectedImageIndex] || previewImages[0] || '/placeholder.png'}
                alt={`${product.title} - Image ${selectedImageIndex + 1}`}
                className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Right Navigation Arrow */}
            {previewImages && previewImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImageIndex((prev) => 
                    prev === previewImages.length - 1 ? 0 : prev + 1
                  )
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full w-12 h-12 flex items-center justify-center z-20 transition-all"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Thumbnail Navigation */}
            {previewImages && previewImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                <div className="flex space-x-2 bg-black/50 rounded-lg p-2 backdrop-blur-sm">
                  {previewImages.map((img: string, index: number) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedImageIndex(index)
                      }}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
                          ? 'border-white ring-2 ring-blue-400'
                          : 'border-white/50 hover:border-white/75 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Image Counter */}
            {previewImages && previewImages.length > 1 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-sm">
                <span className="text-sm font-medium">
                  {selectedImageIndex + 1} / {previewImages.length}
                </span>
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
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Төлбөр төлөх
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl"
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
                      <span className="text-base font-semibold text-blue-600 dark:text-blue-400">
                        {formatNumber(parseFloat(product.price) || 0)}₮
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {isAuthenticated && (
                      <button
                        onClick={handleWalletPayment}
                        disabled={isProcessingWalletPayment || userBalance < parseFloat(product.price || 0)}
                        className={`w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold text-sm transition-all shadow-lg flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed ${
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
                            <span className="text-base">👛</span>
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
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold text-sm hover:from-green-700 hover:to-green-800 transition-all shadow-lg flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingInvoice ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Бэлдэж байна...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-base">💳</span>
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
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
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
                <div className="text-2xl mb-4">🙏</div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
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
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    ✅ Төлбөр амжилттай!
                  </h3>
                  <button
                    onClick={() => {
                      setIsDownloadModalOpen(false)
                      setDownloadToken(null)
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl"
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
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg flex items-center justify-center space-x-3"
                    >
                      <span className="text-base">⬇️</span>
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
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
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

      {/* FAQ Modal */}
      {isFaqModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsFaqModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                ❓ Түгээмэл асуулт хариулт
              </h3>
              <button
                onClick={() => setIsFaqModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Бүтээгдэхүүнийг хэрхэн худалдаж авах вэ?
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Бүтээгдэхүүнийг худалдаж авахын тулд "Одоо худалдаж авах" товчийг дараад QPay эсвэл хэтэвчээр төлбөр төлөх боломжтой. Төлбөр төлсний дараа файлыг татаж авах боломжтой болно.
                </p>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Төлбөр төлсний дараа файлыг хэр удаан татаж авах боломжтой вэ?
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Төлбөр төлсний дараа татаж авах холбоос 10 минутын хугацаанд хүчинтэй байна. Энэ хугацаанд файлыг татаж авах боломжтой. Холбоос нь нэг удаа ашиглах боломжтой.
                </p>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Хэрэв файлыг татаж авах боломжгүй болсон бол яах вэ?
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Хэрэв татаж авах холбоосын хугацаа дууссан эсвэл алдаа гарсан бол бидэнтэй холбогдоно уу. Бид танд туслах болно.
                </p>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Бүтээгдэхүүнийг буцаах боломжтой юу?
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Бүтээгдэхүүнийг худалдаж авсны дараа буцаах боломжгүй. Гэхдээ хэрэв техникийн асуудал гарсан бол бидэнтэй холбогдоно уу.
                </p>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Ямар төлбөрийн арга хэрэглэж болох вэ?
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Та QPay, хэтэвч эсвэл банкны шилжүүлэгээр төлбөр төлөх боломжтой. Хэрэв таны хэтэвчэнд хангалттай мөнгө байгаа бол хэтэвчээр шууд худалдаж авах боломжтой.
                </p>
              </div>

              <div className="pb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Бүтээгдэхүүний чанар хэрхэн баталгаажсан вэ?
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Бүх бүтээгдэхүүн манай системд баталгаажсан зохиогчдын бүтээлүүд юм. Бүтээгдэхүүний үнэлгээ, тайлбар зэргийг үзэж чанарыг үнэлэх боломжтой.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsFaqModalOpen(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                Хаах
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Similar File Request Modal */}
      {isSimilarFileRequestModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            if (!isSubmittingSimilarFileRequest) {
              setIsSimilarFileRequestModalOpen(false)
              setSimilarFileRequestDescription('')
              setSimilarFileRequestError(null)
              setSimilarFileRequestSuccess(false)
            }
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                📋 Ижил төстэй файл захиалах
              </h3>
              <button
                onClick={() => {
                  if (!isSubmittingSimilarFileRequest) {
                    setIsSimilarFileRequestModalOpen(false)
                    setSimilarFileRequestDescription('')
                    setSimilarFileRequestError(null)
                    setSimilarFileRequestSuccess(false)
                  }
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl"
                disabled={isSubmittingSimilarFileRequest}
              >
                ×
              </button>
            </div>

            {similarFileRequestSuccess ? (
              <div className="text-center py-8">
                <div className="text-2xl mb-4">✅</div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                  Хүсэлт илгээгдлээ
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Таны хүсэлтийг админ хэсэгт илгээлээ. Админ шалгаж, баталгаажуулсны дараа нийтлэгчид дамжуулна.
                </p>
                <button
                  onClick={() => {
                    setIsSimilarFileRequestModalOpen(false)
                    setSimilarFileRequestDescription('')
                    setSimilarFileRequestError(null)
                    setSimilarFileRequestSuccess(false)
                  }}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all"
                >
                  Хаах
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Бүтээгдэхүүн:
                  </label>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {product.title}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Тайлбар (сонголттой)
                  </label>
                  <textarea
                    value={similarFileRequestDescription}
                    onChange={(e) => setSimilarFileRequestDescription(e.target.value)}
                    placeholder="Ямар төрлийн ижил төстэй контент хэрэгтэй байгаагаа тайлбарлана уу..."
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    disabled={isSubmittingSimilarFileRequest}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Тайлбар нь нийтлэгчид туслах болно
                  </p>
                </div>

                {similarFileRequestError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-200 text-sm">{similarFileRequestError}</p>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={async () => {
                      try {
                        setIsSubmittingSimilarFileRequest(true)
                        setSimilarFileRequestError(null)

                        const requestProductId = product.id || product.uuid || productId
                        await createSimilarFileRequest({
                          productId: typeof requestProductId === 'string' ? parseInt(requestProductId) || requestProductId : requestProductId,
                          description: similarFileRequestDescription.trim() || undefined
                        })

                        setSimilarFileRequestSuccess(true)
                      } catch (error: any) {
                        console.error('Error submitting similar file request:', error)
                        setSimilarFileRequestError(error.message || 'Хүсэлт илгээхэд алдаа гарлаа')
                      } finally {
                        setIsSubmittingSimilarFileRequest(false)
                      }
                    }}
                    disabled={isSubmittingSimilarFileRequest}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingSimilarFileRequest ? 'Илгээж байна...' : 'Илгээх'}
                  </button>
                  <button
                    onClick={() => {
                      if (!isSubmittingSimilarFileRequest) {
                        setIsSimilarFileRequestModalOpen(false)
                        setSimilarFileRequestDescription('')
                        setSimilarFileRequestError(null)
                        setSimilarFileRequestSuccess(false)
                      }
                    }}
                    disabled={isSubmittingSimilarFileRequest}
                    className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Цуцлах
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Copyright Report Modal */}
      {isCopyrightReportModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            if (!isSubmittingReport) {
              setIsCopyrightReportModalOpen(false)
              setCopyrightReportComment('')
              setCopyrightReportPhone('')
              setReportError(null)
              setReportSuccess(false)
            }
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                ⚠️ Зохиогчийн эрхийн мэдэгдэл
              </h3>
              <button
                onClick={() => {
                  if (!isSubmittingReport) {
                    setIsCopyrightReportModalOpen(false)
                    setCopyrightReportComment('')
                    setCopyrightReportPhone('')
                    setReportError(null)
                    setReportSuccess(false)
                  }
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl"
                disabled={isSubmittingReport}
              >
                ×
              </button>
            </div>

            {reportSuccess ? (
              <div className="text-center py-8">
                <div className="text-2xl mb-4">✅</div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                  Мэдэгдэл илгээгдлээ
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Таны мэдэгдлийг хүлээн авлаа. Бид шалгаж үзэх болно.
                </p>
                <button
                  onClick={() => {
                    setIsCopyrightReportModalOpen(false)
                    setCopyrightReportComment('')
                    setCopyrightReportPhone('')
                    setReportError(null)
                    setReportSuccess(false)
                  }}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  Хаах
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Бүтээгдэхүүн:
                  </label>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {product.title}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Утасны дугаар <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={copyrightReportPhone}
                    onChange={(e) => setCopyrightReportPhone(e.target.value)}
                    placeholder="99112233"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmittingReport}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Тайлбар <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={copyrightReportComment}
                    onChange={(e) => setCopyrightReportComment(e.target.value)}
                    placeholder="Зохиогчийн эрхийн мэдэгдлийн тайлбар..."
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    disabled={isSubmittingReport}
                  />
                </div>

                {reportError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-200 text-sm">{reportError}</p>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={async () => {
                      if (!copyrightReportComment.trim()) {
                        setReportError('Тайлбар шаардлагатай')
                        return
                      }

                      if (!copyrightReportPhone.trim()) {
                        setReportError('Утасны дугаар шаардлагатай')
                        return
                      }

                      try {
                        setIsSubmittingReport(true)
                        setReportError(null)

                        const reportProductId = product.id || product.uuid || productId
                        await createCopyrightReport({
                          productId: typeof reportProductId === 'string' ? parseInt(reportProductId) || reportProductId : reportProductId,
                          comment: copyrightReportComment.trim(),
                          phone: copyrightReportPhone.trim()
                        })

                        setReportSuccess(true)
                      } catch (error: any) {
                        console.error('Error submitting copyright report:', error)
                        setReportError(error.message || 'Мэдэгдэл илгээхэд алдаа гарлаа')
                      } finally {
                        setIsSubmittingReport(false)
                      }
                    }}
                    disabled={isSubmittingReport}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingReport ? 'Илгээж байна...' : 'Илгээх'}
                  </button>
                  <button
                    onClick={() => {
                      if (!isSubmittingReport) {
                        setIsCopyrightReportModalOpen(false)
                        setCopyrightReportComment('')
                        setCopyrightReportPhone('')
                        setReportError(null)
                        setReportSuccess(false)
                      }
                    }}
                    disabled={isSubmittingReport}
                    className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Цуцлах
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal - for actions that require login */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSelectGoogle={() => setShowAuthModal(false)}
        onSelectFacebook={() => setShowAuthModal(false)}
      />
    </div>
    </>
  )
}

