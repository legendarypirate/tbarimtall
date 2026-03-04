'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getTopJournalists } from '@/lib/api'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

export default function JournalistsPage() {
  const router = useRouter()
  const [journalists, setJournalists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJournalists = async () => {
      try {
        setLoading(true)
        const response = await getTopJournalists(100)
        if (response.journalists && Array.isArray(response.journalists)) {
          setJournalists(response.journalists)
        }
      } catch (error) {
        console.error('Error fetching journalists:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchJournalists()
  }, [])

  const getAvatarUrl = (journalist: any) => {
    if (journalist.avatar) return journalist.avatar
    const seed = journalist.name || journalist.username || journalist.userId || 'default'
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`
  }

  const getMembershipName = (journalist: any) => {
    const membershipName = journalist.membership?.name || ''
    if (membershipName) {
      const upperName = membershipName.toUpperCase()
      if (upperName.includes('PLATINUM')) return 'PLATINUM'
      if (upperName.includes('GOLD')) return 'GOLD'
      if (upperName.includes('SILVER')) return 'SILVER'
      if (upperName.includes('BRONZE')) return 'BRONZE'
      if (upperName.includes('FREE')) return 'FREE'
      return membershipName.toUpperCase()
    }
    return 'FREE'
  }

  const getMembershipBadgeColor = (name: string) => {
    const upperName = name.toUpperCase()
    if (upperName.includes('PLATINUM')) return 'bg-cyan-500 text-white'
    if (upperName.includes('GOLD')) return 'bg-yellow-500 text-white'
    if (upperName.includes('SILVER')) return 'bg-slate-500 text-white'
    if (upperName.includes('BRONZE')) return 'bg-orange-600 text-white'
    return 'bg-gray-500 text-white'
  }

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
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      <section className="bg-white dark:bg-gray-900 py-12">
        <div className="w-full px-3 sm:px-4 lg:container lg:mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-darkBlue-500 dark:text-white mb-2">
              Бүх нийтлэгчид
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Платформын нүүр царай болон контент бүтээгчид
            </p>
          </div>

          {journalists.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {journalists.map((journalist) => {
                  const membershipName = getMembershipName(journalist)
                  const badgeColor = getMembershipBadgeColor(membershipName)
                  return (
                    <div
                      key={journalist.userId || journalist.id}
                      onClick={() => router.push(`/journalist/${journalist.userId || journalist.id}`)}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-[#004e6c]/10 dark:border-gray-700 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 transition-all transform hover:-translate-y-0.5 hover:shadow-lg cursor-pointer group"
                    >
                      <div className="p-4 text-center">
                        <div className="relative inline-block mb-3">
                          <img
                            src={getAvatarUrl(journalist)}
                            alt={journalist.name || journalist.username || 'Journalist'}
                            className="w-16 h-16 rounded-full border-2 border-[#004e6c] dark:border-[#006b8f] shadow-sm group-hover:border-[#ff6b35] dark:group-hover:border-[#ff8555] transition-colors"
                            onError={(e) => {
                              const seed = journalist.name || journalist.username || journalist.userId || 'default'
                              ;(e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`
                            }}
                          />
                          <div className={`absolute -bottom-0.5 -right-0.5 ${badgeColor} text-[9px] font-medium px-1.5 py-0.5 rounded-full shadow-sm border border-white dark:border-gray-800 z-20 uppercase`}>
                            {membershipName}
                          </div>
                        </div>
                        <h3 className="text-sm font-semibold text-[#004e6c] dark:text-gray-200 mb-1 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors line-clamp-1">
                          {journalist.name || journalist.username || 'Unknown'}
                        </h3>
                        {journalist.username && (
                          <p className="text-xs text-[#004e6c]/60 dark:text-gray-400 mb-2 line-clamp-1">
                            {journalist.username.startsWith('@') ? journalist.username : `@${journalist.username}`}
                          </p>
                        )}
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center justify-center space-x-1">
                            <span className="text-yellow-400 text-sm">⭐</span>
                            <span className="text-sm font-medium text-[#004e6c] dark:text-gray-200">
                              {typeof journalist.rating === 'number' ? journalist.rating.toFixed(1) : parseFloat(journalist.rating ?? 0).toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center justify-center space-x-2 text-xs text-[#004e6c]/70 dark:text-gray-400">
                            <span className="flex items-center space-x-0.5">
                              <span>👥</span>
                              <span>
                                {(() => {
                                  const followers = typeof journalist.followers === 'number' ? journalist.followers : (parseInt(journalist.followers) || 0)
                                  if (followers >= 1000) return (followers / 1000).toFixed(1) + 'K'
                                  return followers.toLocaleString()
                                })()}
                              </span>
                            </span>
                            <span className="flex items-center space-x-0.5">
                              <span>📝</span>
                              <span>{journalist.posts ?? 0} Контент</span>
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/journalist/${journalist.userId || journalist.id}`)
                          }}
                          className="w-full bg-darkBlue-500 dark:bg-darkBlue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-darkBlue-600 dark:hover:bg-darkBlue-700 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                        >
                          Профайл
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-sm text-[#004e6c]/70 dark:text-gray-400 font-medium mt-6 text-center">
                {journalists.length} нийтлэгч
              </p>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">👤</div>
              <h3 className="text-lg font-semibold text-[#004e6c] dark:text-gray-200 mb-2">
                Нийтлэгч олдсонгүй
              </h3>
              <p className="text-[#004e6c]/70 dark:text-gray-400">
                Одоогоор бүртгэгдсэн нийтлэгч байхгүй байна.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
