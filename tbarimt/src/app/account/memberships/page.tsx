'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Ачааллаж байна...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            <span>←</span> Буцах
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Гишүүнчлэл сонгох
          </h1>
          <p className="text-gray-600">
            Өөрийн хэрэгцээнд тохирох гишүүнчлэл сонгоод илүү олон файл нийтлэх боломжтой болно
          </p>
        </div>

        {!isSubscriptionActive && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">
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
                className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                  isCurrent ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className={`p-6 ${
                  isCurrent 
                    ? 'bg-blue-500 text-white' 
                    : isFree 
                    ? 'bg-gray-100' 
                    : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                }`}>
                  <h3 className="text-xl font-bold mb-2">{membership.name}</h3>
                  <div className="text-3xl font-bold mb-2">
                    {formatPrice(membership.price)}
                  </div>
                  {isFree && (
                    <p className="text-sm opacity-90">Суурь гишүүнчлэл</p>
                  )}
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Нийтлэх хязгаар:</span>
                      <span className="font-semibold">{membership.maxPosts}</span>
                    </div>
                    {membership.description && (
                      <p className="text-sm text-gray-500 mt-2">
                        {membership.description}
                      </p>
                    )}
                  </div>

                  {membership.advantages && membership.advantages.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Давуу талууд:</h4>
                      <ul className="space-y-1">
                        {membership.advantages.map((advantage, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span>{advantage}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {isCurrent ? (
                    <button
                      onClick={() => handleExtendMembership(membership.id)}
                      disabled={isExtending || isCreatingInvoice}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isExtending ? 'Ачааллаж байна...' : 'Сунгах'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectMembership(membership.id)}
                      disabled={isCreatingInvoice}
                      className={`w-full py-2 rounded-lg font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${
                        isFree
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isCreatingInvoice ? 'Ачааллаж байна...' : 'Сонгох'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {myMembership && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Одоогийн байдал</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Одоогийн гишүүнчлэл</p>
                <p className="font-semibold text-lg">
                  {myMembership.membership?.name || 'FREE'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Нийтэлсэн файл</p>
                <p className="font-semibold text-lg">
                  {myMembership.publishedCount} / {myMembership.maxPosts}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Хугацаа</p>
                <p className="font-semibold text-lg">
                  {myMembership.isSubscriptionActive ? 'Идэвхтэй' : 'Дууссан'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
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
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>

            <h2 className="text-2xl font-bold mb-4">QPay төлбөр</h2>

            {paymentError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800">{paymentError}</p>
              </div>
            )}

            {paymentStatus === 'completed' ? (
              <div className="text-center py-8">
                <div className="text-green-500 text-6xl mb-4">✓</div>
                <p className="text-xl font-semibold text-green-600">Төлбөр амжилттай төлөгдлөө!</p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  QPay апп ашиглан QR кодыг уншуулж төлбөрөө төлөөрэй.
                </p>

                {qrCode ? (
                  <div className="flex flex-col items-center mb-4">
                    <img
                      src={qrCode}
                      alt="QPay QR Code"
                      className="w-64 h-64 border-2 border-gray-200 rounded-lg mb-4"
                    />
                    {qrText && (
                      <p className="text-sm text-gray-600 break-all text-center">{qrText}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-8 mb-4 text-center">
                    <p className="text-gray-600">QR код үүсгэж байна...</p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    Төлбөр төлөгдсөний дараа автоматаар шинэчлэгдэнэ. Хэсэг хугацааны дараа хуудас шинэчлэх шаардлагагүй.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
