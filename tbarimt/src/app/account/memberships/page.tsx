'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDarkMode } from '@/hooks/useDarkMode'
import { getActiveMemberships, getMyMembership, createMembershipInvoice, checkMembershipPaymentStatus } from '@/lib/api'

interface Membership {
  id: number
  name: string
  price: string
  maxPosts: number
  advantages: string[]
  description: string
  order: number
}

interface MyMembership {
  membership: Membership | null
  subscriptionStartDate: string | null
  subscriptionEndDate: string | null
  isSubscriptionActive: boolean
  publishedCount: number
  maxPosts: number
  remainingPosts: number
  canPost: boolean
}

export default function MembershipsPage() {
  const router = useRouter()
  const { isDark } = useDarkMode()
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [myMembership, setMyMembership] = useState<MyMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMembership, setSelectedMembership] = useState<number | null>(null)
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrText, setQrText] = useState<string | null>(null)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isExtending, setIsExtending] = useState(false)
  const paymentPollingInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchData()
    
    // Cleanup polling on unmount
    return () => {
      if (paymentPollingInterval.current) {
        clearInterval(paymentPollingInterval.current)
      }
    }
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [membershipsData, myMembershipData] = await Promise.all([
        getActiveMemberships(),
        getMyMembership()
      ])
      
      if (membershipsData.memberships) {
        setMemberships(membershipsData.memberships)
      }
      
      if (myMembershipData) {
        setMyMembership(myMembershipData)
      }
    } catch (error) {
      console.error('Error fetching memberships:', error)
      alert('Алдаа гарлаа. Дахин оролдоно уу.')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price)
    if (numPrice === 0) return 'Үнэгүй'
    return new Intl.NumberFormat('mn-MN').format(numPrice) + '₮'
  }

  const startPaymentPolling = (invoiceId: string) => {
    // Clear any existing interval
    if (paymentPollingInterval.current) {
      clearInterval(paymentPollingInterval.current)
    }

    const interval = setInterval(async () => {
      try {
        const response = await checkMembershipPaymentStatus(invoiceId)
        
        if (response.success && response.payment) {
          if (response.payment.isPaid) {
            setPaymentStatus('completed')
            if (paymentPollingInterval.current) {
              clearInterval(paymentPollingInterval.current)
              paymentPollingInterval.current = null
            }
            
            // Refresh membership data
            await fetchData()
            
            // Close modal after 2 seconds
            setTimeout(() => {
              setShowPaymentModal(false)
              setQrCode(null)
              setQrText(null)
              setInvoiceId(null)
              setPaymentStatus(null)
              setSelectedMembership(null)
              setIsExtending(false)
              alert('Төлбөр амжилттай төлөгдлөө! Гишүүнчлэл шинэчлэгдлээ.')
            }, 2000)
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error)
      }
    }, 3000) // Check every 3 seconds

    paymentPollingInterval.current = interval
  }

  const handleExtendMembership = async (membershipId: number) => {
    try {
      setIsExtending(true)
      setIsCreatingInvoice(true)
      setPaymentError(null)

      const response = await createMembershipInvoice({
        membershipId,
        extendOnly: true
      })

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
        setShowPaymentModal(true)
        setPaymentStatus('pending')
        
        // Start polling for payment status
        startPaymentPolling(response.invoice.invoice_id)
      } else {
        throw new Error('Failed to create invoice')
      }
    } catch (error: any) {
      console.error('Error creating membership invoice:', error)
      setPaymentError(error.message || 'Төлбөрийн хуудас үүсгэхэд алдаа гарлаа')
    } finally {
      setIsCreatingInvoice(false)
      setIsExtending(false)
    }
  }

  const handleSelectMembership = async (membershipId: number) => {
    const isCurrent = isCurrentMembership(membershipId)
    
    if (isCurrent) {
      // Extend current membership
      await handleExtendMembership(membershipId)
    } else {
      // Different membership - show alert and proceed to payment
      alert('Төлбөрийн хуудас руу шилжиж байна...')
      
      try {
        setIsCreatingInvoice(true)
        setPaymentError(null)

        const response = await createMembershipInvoice({
          membershipId,
          extendOnly: false
        })

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
          setShowPaymentModal(true)
          setPaymentStatus('pending')
          
          // Start polling for payment status
          startPaymentPolling(response.invoice.invoice_id)
        } else {
          throw new Error('Failed to create invoice')
        }
      } catch (error: any) {
        console.error('Error creating membership invoice:', error)
        setPaymentError(error.message || 'Төлбөрийн хуудас үүсгэхэд алдаа гарлаа')
      } finally {
        setIsCreatingInvoice(false)
      }
    }
  }

  const isCurrentMembership = (membershipId: number) => {
    return myMembership?.membership?.id === membershipId
  }

  const isSubscriptionActive = myMembership?.isSubscriptionActive

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#004e6c] dark:border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-[#004e6c] dark:text-gray-200 text-lg font-medium">Ачааллаж байна...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-[#004e6c]/10 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-[#004e6c] dark:text-gray-300 hover:text-[#ff6b35] dark:hover:text-[#ff8555] transition-colors font-semibold"
            >
              <span>←</span>
              <span>Буцах</span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg overflow-hidden">
                <img src="/lg.png" alt="TBARIMT Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-bold text-[#004e6c] dark:text-gray-200">
                Гишүүнчлэл сонгох
              </h1>
            </div>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-[#004e6c]/70 dark:text-gray-400 font-medium">
            Өөрийн хэрэгцээнд тохирох гишүүнчлэл сонгоод илүү олон файл нийтлэх боломжтой болно
          </p>
        </div>

        {!isSubscriptionActive && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-800 dark:text-red-300 font-semibold">
              ⚠️ Таны гишүүнчлэлийн хугацаа дууссан байна. Шинэ гишүүнчлэл сонгох шаардлагатай.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {memberships.map((membership) => {
            const isCurrent = isCurrentMembership(membership.id)
            const isFree = parseFloat(membership.price) === 0
            
            return (
              <div
                key={membership.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border-2 transition-all transform hover:-translate-y-1 hover:shadow-2xl ${
                  isCurrent 
                    ? 'border-[#004e6c] dark:border-[#006b8f] ring-2 ring-[#004e6c]/20 dark:ring-[#006b8f]/20' 
                    : 'border-[#004e6c]/10 dark:border-gray-700 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30'
                }`}
              >
                <div className={`p-6 relative overflow-hidden ${
                  isCurrent 
                    ? 'bg-gradient-to-br from-[#004e6c] to-[#004e6c]/90 dark:from-[#006b8f] dark:to-[#004e6c] text-white' 
                    : isFree 
                    ? 'bg-gradient-to-br from-gray-100 dark:from-gray-700 to-gray-200 dark:to-gray-600 text-[#004e6c] dark:text-gray-200' 
                    : 'bg-gradient-to-br from-[#004e6c] to-[#ff6b35] dark:from-[#006b8f] dark:to-[#ff8555] text-white'
                }`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-2">{membership.name}</h3>
                    <div className="text-3xl font-bold mb-2">
                      {formatPrice(membership.price)}
                    </div>
                    {isFree && (
                      <p className="text-sm opacity-90 font-medium">Суурь гишүүнчлэл</p>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#004e6c]/70 dark:text-gray-400 font-medium">Нийтлэх хязгаар:</span>
                      <span className="font-bold text-[#004e6c] dark:text-gray-200">{membership.maxPosts}</span>
                    </div>
                    {membership.description && (
                      <p className="text-sm text-[#004e6c]/60 dark:text-gray-400 mt-2 font-medium">
                        {membership.description}
                      </p>
                    )}
                  </div>

                  {membership.advantages && membership.advantages.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-[#004e6c] dark:text-gray-200 mb-2">Давуу талууд:</h4>
                      <ul className="space-y-1">
                        {membership.advantages.map((advantage, idx) => (
                          <li key={idx} className="text-sm text-[#004e6c]/70 dark:text-gray-400 flex items-start gap-2 font-medium">
                            <span className="text-[#ff6b35] dark:text-[#ff8555] font-bold">✓</span>
                            <span>{advantage}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {isCurrent ? (
                    !isFree ? (
                      <button
                        onClick={() => handleExtendMembership(membership.id)}
                        disabled={isExtending || isCreatingInvoice}
                        className="w-full bg-[#004e6c] dark:bg-[#006b8f] text-white py-3 rounded-xl font-semibold hover:bg-[#ff6b35] dark:hover:bg-[#ff8555] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isExtending ? 'Ачааллаж байна...' : 'Сунгах'}
                      </button>
                    ) : (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold text-center">
                        Сонгогдсон
                      </div>
                    )
                  ) : (
                    !isFree && (
                      <button
                        onClick={() => handleSelectMembership(membership.id)}
                        disabled={isCreatingInvoice}
                        className="w-full py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none bg-[#004e6c] dark:bg-[#006b8f] text-white hover:bg-[#ff6b35] dark:hover:bg-[#ff8555]"
                      >
                        {isCreatingInvoice ? 'Ачааллаж байна...' : 'Сонгох'}
                      </button>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {myMembership && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border-2 border-[#004e6c]/10 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-[#004e6c] dark:text-gray-200">Одоогийн байдал</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-[#004e6c]/5 dark:from-[#004e6c]/10 via-white dark:via-gray-800 to-[#ff6b35]/5 dark:to-[#ff6b35]/10 rounded-xl p-4 border-2 border-[#004e6c]/10 dark:border-gray-700">
                <p className="text-[#004e6c]/70 dark:text-gray-400 text-sm font-medium mb-1">Одоогийн гишүүнчлэл</p>
                <p className="font-bold text-lg text-[#004e6c] dark:text-gray-200">
                  {myMembership.membership?.name || 'FREE'}
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#004e6c]/5 dark:from-[#004e6c]/10 via-white dark:via-gray-800 to-[#ff6b35]/5 dark:to-[#ff6b35]/10 rounded-xl p-4 border-2 border-[#004e6c]/10 dark:border-gray-700">
                <p className="text-[#004e6c]/70 dark:text-gray-400 text-sm font-medium mb-1">Нийтэлсэн файл</p>
                <p className="font-bold text-lg text-[#004e6c] dark:text-gray-200">
                  {myMembership.publishedCount} / {myMembership.maxPosts}
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#004e6c]/5 dark:from-[#004e6c]/10 via-white dark:via-gray-800 to-[#ff6b35]/5 dark:to-[#ff6b35]/10 rounded-xl p-4 border-2 border-[#004e6c]/10 dark:border-gray-700">
                <p className="text-[#004e6c]/70 dark:text-gray-400 text-sm font-medium mb-1">Хугацаа</p>
                <p className={`font-bold text-lg ${
                  myMembership.isSubscriptionActive ? 'text-[#004e6c] dark:text-gray-200' : 'text-red-600 dark:text-red-400'
                }`}>
                  {myMembership.isSubscriptionActive ? 'Идэвхтэй' : 'Дууссан'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border-2 border-[#004e6c]/10 dark:border-gray-700">
            <div className="p-6 border-b-2 border-[#004e6c]/10 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#004e6c] dark:text-gray-200">QPay төлбөр</h2>
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setQrCode(null)
                    setQrText(null)
                    setInvoiceId(null)
                    setPaymentStatus(null)
                    setPaymentError(null)
                    if (paymentPollingInterval.current) {
                      clearInterval(paymentPollingInterval.current)
                      paymentPollingInterval.current = null
                    }
                  }}
                  className="text-[#004e6c]/60 dark:text-gray-400 hover:text-[#ff6b35] dark:hover:text-[#ff8555] transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {paymentError && (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                  <p className="text-red-800 dark:text-red-300 font-medium">{paymentError}</p>
                </div>
              )}

              {paymentStatus === 'completed' ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-[#ff6b35] dark:text-[#ff8555] mb-2">
                    Төлбөр амжилттай төлөгдлөө!
                  </h3>
                  <p className="text-[#004e6c]/70 dark:text-gray-400 font-medium">
                    Гишүүнчлэл амжилттай шинэчлэгдлээ.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[#004e6c]/70 dark:text-gray-400 font-medium mb-4">
                    QPay апп ашиглан QR кодыг уншуулж төлбөрөө төлөөрэй.
                  </p>

                  {qrCode ? (
                    <div className="flex flex-col items-center mb-4">
                      <img
                        src={qrCode}
                        alt="QPay QR Code"
                        className="w-64 h-64 border-2 border-[#004e6c]/20 dark:border-gray-600 rounded-xl mb-4"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {qrText && (
                        <p className="text-sm text-[#004e6c]/70 dark:text-gray-400 break-all text-center font-medium">{qrText}</p>
                      )}
                      <div className="flex items-center justify-center space-x-2 text-sm text-[#ff6b35] dark:text-[#ff8555] mt-4">
                        <div className="w-2 h-2 bg-[#ff6b35] dark:bg-[#ff8555] rounded-full animate-pulse"></div>
                        <span className="font-medium">Төлбөрийн статус шалгаж байна...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-[#004e6c]/5 dark:from-[#004e6c]/10 via-white dark:via-gray-800 to-[#ff6b35]/5 dark:to-[#ff6b35]/10 rounded-xl p-8 mb-4 text-center border-2 border-[#004e6c]/10 dark:border-gray-700">
                      <div className="w-12 h-12 border-4 border-[#004e6c] dark:border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-[#004e6c]/70 dark:text-gray-400 font-medium">QR код үүсгэж байна...</p>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-[#004e6c]/5 dark:from-[#004e6c]/10 via-white dark:via-gray-800 to-[#ff6b35]/5 dark:to-[#ff6b35]/10 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-xl p-4">
                    <p className="text-sm text-[#004e6c]/80 dark:text-gray-300 font-medium">
                      Төлбөр төлөгдсөний дараа автоматаар шинэчлэгдэнэ. Хэсэг хугацааны дараа хуудас шинэчлэх шаардлагагүй.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
