'use client'

import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getTranslation } from '@/lib/translations'
import { getActiveMemberships, createMembershipInvoice, checkMembershipPaymentStatus } from '@/lib/api'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AuthModal from '@/components/AuthModal'

export default function MembershipPage() {
  const { language } = useLanguage()
  const [memberships, setMemberships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrText, setQrText] = useState<string | null>(null)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false)
  const paymentPollingInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const fetchMemberships = async () => {
      try {
        setLoading(true)
        const membershipsRes = await getActiveMemberships().catch(() => ({ memberships: [] }))
        if (membershipsRes.memberships && Array.isArray(membershipsRes.memberships)) {
          setMemberships(membershipsRes.memberships)
        }
      } catch (error) {
        console.error('Error fetching memberships:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchMemberships()
  }, [])

  const isAuthenticated = () => {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('token')
  }

  const startPaymentPolling = (invId: string) => {
    if (paymentPollingInterval.current) clearInterval(paymentPollingInterval.current)
    const checkPayment = async () => {
      try {
        const response = await checkMembershipPaymentStatus(invId)
        if (response.success && response.order && (response.order.status === 'completed' || response.order.status === 'paid')) {
          setPaymentStatus('completed')
          if (paymentPollingInterval.current) {
            clearInterval(paymentPollingInterval.current)
            paymentPollingInterval.current = null
          }
          setTimeout(() => window.location.reload(), 2000)
        }
      } catch (e) {
        console.error('Error checking payment status:', e)
      }
    }
    paymentPollingInterval.current = setInterval(checkPayment, 3000)
  }

  const handleMembershipSelect = async (membership: any) => {
    const isFree = typeof membership.price === 'number' ? membership.price === 0 : parseFloat(String(membership.price)) === 0
    if (isFree) return
    if (!isAuthenticated()) {
      setShowAuthModal(true)
      return
    }
    try {
      setIsCreatingInvoice(true)
      setPaymentError(null)
      const response = await createMembershipInvoice({ membershipId: membership.id, extendOnly: false })
      if (response.success && response.invoice) {
        setInvoiceId(response.invoice.invoice_id)
        let qrImage = response.invoice.qr_image || response.invoice.qr_code
        if (qrImage) {
          if (qrImage.startsWith('iVBORw0KGgo') || qrImage.startsWith('/9j/')) {
            qrImage = (qrImage.startsWith('iVBORw0KGgo') ? 'data:image/png;base64,' : 'data:image/jpeg;base64,') + qrImage
          } else if (!qrImage.startsWith('data:') && !qrImage.startsWith('http://') && !qrImage.startsWith('https://') && !qrImage.startsWith('/')) {
            qrImage = 'data:image/png;base64,' + qrImage
          }
        }
        if (qrImage && (qrImage.startsWith('data:') || qrImage.startsWith('http://') || qrImage.startsWith('https://'))) {
          setQrCode(qrImage)
        } else {
          setQrCode(null)
        }
        setQrText(response.invoice.qr_text)
        setShowPaymentModal(true)
        setPaymentStatus('pending')
        startPaymentPolling(response.invoice.invoice_id)
      } else {
        throw new Error('Failed to create invoice')
      }
    } catch (error: any) {
      console.error('Error creating membership invoice:', error)
      const errorMessage = error.message || ''
      const isAuthError = errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid token') || errorMessage.toLowerCase().includes('unauthorized')
      if (isAuthError) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setShowAuthModal(true)
        setPaymentError(null)
      } else {
        setPaymentError(errorMessage || 'Төлбөрийн хуудас үүсгэхэд алдаа гарлаа')
      }
    } finally {
      setIsCreatingInvoice(false)
    }
  }

  const closePaymentModal = () => {
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
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#004e6c] dark:border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-[#004e6c] dark:text-gray-200 text-lg font-medium">{getTranslation(language, 'loading')}</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      {/* Гишүүнчлэлийн эрх - same as home page section */}
      {memberships.length > 0 ? (
        <section className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-20">
          <div className="w-full px-3 py-4 lg:container lg:mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-darkBlue-500 dark:text-white mb-3">
                Гишүүнчлэлийн эрх
              </h2>
              <p className="text-lg text-[#004e6c]/80 dark:text-gray-400 max-w-2xl mx-auto">
                Өөрийн хэрэгцээнд тохирох гишүүнчлэлийн эрхийг сонгоно уу
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {memberships.map((membership: any, index: number) => {
                const isFree = typeof membership.price === 'number' ? membership.price === 0 : parseFloat(String(membership.price)) === 0
                const formatPrice = (price: number | string) => {
                  const numPrice = typeof price === 'number' ? price : parseFloat(String(price))
                  if (numPrice === 0) return 'Үнэгүй'
                  return new Intl.NumberFormat('mn-MN').format(numPrice) + '₮'
                }
                const nameUpper = (membership.name || '').toUpperCase()
                const tierTheme = (() => {
                  if (isFree || nameUpper.includes('FREE')) return { bg: 'from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600', accent: 'text-slate-700 dark:text-slate-200', btn: 'bg-slate-500', border: 'border-slate-300 dark:border-slate-600', icon: '🔓', badge: 'bg-slate-500' }
                  if (nameUpper.includes('BRONZE')) return { bg: 'from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40', accent: 'text-amber-800 dark:text-amber-200', btn: 'bg-amber-500 hover:bg-amber-600', border: 'border-amber-300 dark:border-amber-700', icon: '🥉', badge: 'bg-amber-500' }
                  if (nameUpper.includes('SILVER')) return { bg: 'from-slate-200 to-gray-200 dark:from-slate-600 dark:to-gray-700', accent: 'text-slate-800 dark:text-slate-100', btn: 'bg-slate-500 hover:bg-slate-600', border: 'border-slate-400 dark:border-slate-500', icon: '🥈', badge: 'bg-slate-400' }
                  if (nameUpper.includes('GOLD')) return { bg: 'from-amber-200 to-yellow-100 dark:from-amber-800/50 dark:to-yellow-900/40', accent: 'text-amber-900 dark:text-amber-100', btn: 'bg-amber-500 hover:bg-amber-600', border: 'border-amber-400 dark:border-amber-600', icon: '🥇', badge: 'bg-amber-400' }
                  if (nameUpper.includes('PLATINUM')) return { bg: 'from-cyan-100 to-teal-100 dark:from-cyan-900/40 dark:to-teal-900/40', accent: 'text-cyan-900 dark:text-cyan-100', btn: 'bg-cyan-500 hover:bg-cyan-600', border: 'border-cyan-400 dark:border-cyan-600', icon: '💎', badge: 'bg-cyan-400' }
                  const themes = [
                    { bg: 'from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600', accent: 'text-slate-700 dark:text-slate-200', btn: 'bg-slate-500', border: 'border-slate-300 dark:border-slate-600', icon: '🔓', badge: 'bg-slate-500' },
                    { bg: 'from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40', accent: 'text-amber-800 dark:text-amber-200', btn: 'bg-amber-500 hover:bg-amber-600', border: 'border-amber-300 dark:border-amber-700', icon: '🥉', badge: 'bg-amber-500' },
                    { bg: 'from-slate-200 to-gray-200 dark:from-slate-600 dark:to-gray-700', accent: 'text-slate-800 dark:text-slate-100', btn: 'bg-slate-500 hover:bg-slate-600', border: 'border-slate-400 dark:border-slate-500', icon: '🥈', badge: 'bg-slate-400' },
                    { bg: 'from-cyan-100 to-teal-100 dark:from-cyan-900/40 dark:to-teal-900/40', accent: 'text-cyan-900 dark:text-cyan-100', btn: 'bg-cyan-500 hover:bg-cyan-600', border: 'border-cyan-400 dark:border-cyan-600', icon: '💎', badge: 'bg-cyan-400' },
                  ]
                  return themes[index % themes.length]
                })()
                return (
                  <div
                    key={membership.id}
                    className={`rounded-2xl overflow-hidden border-2 ${tierTheme.border} bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col`}
                  >
                    <div className={`bg-gradient-to-br ${tierTheme.bg} px-6 py-5 relative`}>
                      <span className="text-2xl" aria-hidden>{tierTheme.icon}</span>
                      <h3 className={`text-lg font-bold mt-2 ${tierTheme.accent}`}>
                        {membership.name}
                      </h3>
                      <p className={`text-2xl font-bold mt-1 ${tierTheme.accent}`}>
                        {formatPrice(membership.price)}
                      </p>
                      {!isFree && (
                        <p className={`text-sm opacity-90 mt-0.5 ${tierTheme.accent}`}>/ сар</p>
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#004e6c]/70 dark:text-gray-400 font-medium">Нийтлэх хязгаар</span>
                          <span className="font-bold text-[#004e6c] dark:text-gray-200">
                            {membership.maxPosts === 0 ? 'Хязгааргүй' : membership.maxPosts}
                          </span>
                        </div>
                        {membership.description && (
                          <p className="text-sm text-[#004e6c]/60 dark:text-gray-400 mt-2 leading-relaxed">
                            {membership.description}
                          </p>
                        )}
                      </div>
                      {membership.advantages && Array.isArray(membership.advantages) && membership.advantages.length > 0 && (
                        <ul className="space-y-2 mb-6 flex-1">
                          {membership.advantages.map((advantage: string, idx: number) => (
                            <li key={idx} className="text-sm text-[#004e6c]/80 dark:text-gray-300 flex items-start gap-2">
                              <span className="text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0">✓</span>
                              <span>{advantage}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {!isFree ? (
                        <button
                          onClick={() => handleMembershipSelect(membership)}
                          disabled={isCreatingInvoice}
                          className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${tierTheme.btn}`}
                        >
                          {isCreatingInvoice ? 'Төлбөрийн хуудас үүсгэж байна...' : 'Сонгох'}
                        </button>
                      ) : (
                        <div className="w-full py-3.5 rounded-xl font-semibold text-center text-[#004e6c]/60 dark:text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-600">
                          Үнэгүй эрх
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-20">
          <div className="w-full px-3 py-4 lg:container lg:mx-auto">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-darkBlue-500 dark:text-white mb-3">
                Гишүүнчлэлийн эрх
              </h2>
              <p className="text-lg text-[#004e6c]/80 dark:text-gray-400">
                Одоогоор гишүүнчлэлийн эрх байхгүй байна.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Payment Modal - same as home */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border-2 border-[#004e6c]/10 dark:border-gray-700">
            <div className="p-6 border-b-2 border-[#004e6c]/10 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#004e6c] dark:text-gray-200">QPay төлбөр</h2>
                <button onClick={closePaymentModal} className="text-[#004e6c]/60 dark:text-gray-400 hover:text-[#ff6b35] dark:hover:text-[#ff8555] transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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
                  <h3 className="text-xl font-bold text-[#ff6b35] dark:text-[#ff8555] mb-2">Төлбөр амжилттай төлөгдлөө!</h3>
                  <p className="text-[#004e6c]/70 dark:text-gray-400 font-medium">Гишүүнчлэл амжилттай шинэчлэгдлээ.</p>
                </div>
              ) : (
                <>
                  <p className="text-[#004e6c]/70 dark:text-gray-400 font-medium mb-4">QPay апп ашиглан QR кодыг уншуулж төлбөрөө төлөөрэй.</p>
                  {qrCode ? (
                    <div className="flex flex-col items-center mb-4">
                      <img src={qrCode} alt="QPay QR Code" className="w-64 h-64 border-2 border-[#004e6c]/20 dark:border-gray-600 rounded-xl mb-4" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      {qrText && <p className="text-sm text-[#004e6c]/70 dark:text-gray-400 break-all text-center font-medium">{qrText}</p>}
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
                    <p className="text-sm text-[#004e6c]/80 dark:text-gray-300 font-medium">Төлбөр төлөгдсөний дараа автоматаар шинэчлэгдэнэ. Хэсэг хугацааны дараа хуудас шинэчлэх шаардлагагүй.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSelectGoogle={() => setShowAuthModal(false)}
        onSelectFacebook={() => setShowAuthModal(false)}
      />

      <Footer />
    </main>
  )
}
