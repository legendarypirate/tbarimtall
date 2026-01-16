'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { getTranslation } from '@/lib/translations'
import { getActiveMemberships } from '@/lib/api'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function MembershipPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [memberships, setMemberships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

      {/* Membership Section */}
      {memberships.length > 0 ? (
        <section className="bg-gray-200 dark:bg-gray-800 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#004e6c] dark:text-gray-200 mb-4">
                {getTranslation(language, 'membershipPlans') || 'Membership Plans'}
              </h2>
              <p className="text-lg text-[#004e6c]/70 dark:text-gray-400 max-w-2xl mx-auto">
                {getTranslation(language, 'chooseMembershipPlan') || 'Choose the perfect membership plan for your needs'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {memberships.map((membership) => {
                const isFree = typeof membership.price === 'number' ? membership.price === 0 : parseFloat(String(membership.price)) === 0
                const formatPrice = (price: number | string) => {
                  const numPrice = typeof price === 'number' ? price : parseFloat(String(price))
                  if (numPrice === 0) return 'Үнэгүй'
                  return new Intl.NumberFormat('mn-MN').format(numPrice) + '₮'
                }
                
                return (
                  <div
                    key={membership.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border-2 border-[#004e6c]/10 dark:border-gray-700 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 transition-all transform hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className={`p-6 relative overflow-hidden ${
                      isFree 
                        ? 'bg-gradient-to-br from-gray-100 dark:from-gray-700 to-gray-200 dark:to-gray-600 text-[#004e6c] dark:text-gray-200' 
                        : 'bg-gradient-to-br from-[#004e6c] to-[#ff6b35] dark:from-[#006b8f] dark:to-[#ff8555] text-white'
                    }`}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                      <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2">{membership.name}</h3>
                        <div className="text-3xl font-bold mb-2">
                          {formatPrice(membership.price)}
                        </div>
                      
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

                      {membership.advantages && Array.isArray(membership.advantages) && membership.advantages.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-[#004e6c] dark:text-gray-200 mb-2">Давуу талууд:</h4>
                          <ul className="space-y-1">
                            {membership.advantages.map((advantage: string, idx: number) => (
                              <li key={idx} className="text-sm text-[#004e6c]/70 dark:text-gray-400 flex items-start gap-2 font-medium">
                                <span className="text-[#ff6b35] dark:text-[#ff8555] font-bold">✓</span>
                                <span>{advantage}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <button
                        onClick={() => router.push('/account/memberships')}
                        className={`w-full py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                          isFree
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                            : 'bg-[#004e6c] dark:bg-[#006b8f] text-white hover:bg-[#ff6b35] dark:hover:bg-[#ff8555]'
                        }`}
                      >
                        {getTranslation(language, 'selectPlan') || 'Сонгох'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-gray-200 dark:bg-gray-800 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-[#004e6c] dark:text-gray-200 mb-4">
                {getTranslation(language, 'membershipPlans') || 'Membership Plans'}
              </h2>
              <p className="text-lg text-[#004e6c]/70 dark:text-gray-400">
                No membership plans available at the moment.
              </p>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  )
}

