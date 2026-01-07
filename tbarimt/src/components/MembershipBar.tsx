'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getMyMembership } from '@/lib/api'

interface MembershipInfo {
  membership: {
    id: number
    name: string
    price: string
    maxPosts: number
    advantages: string[]
    description: string
  } | null
  subscriptionStartDate: string | null
  subscriptionEndDate: string | null
  isSubscriptionActive: boolean
  publishedCount: number
  maxPosts: number
  remainingPosts: number
  canPost: boolean
}

export default function MembershipBar() {
  const router = useRouter()
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMembershipInfo()
  }, [])

  const fetchMembershipInfo = async () => {
    try {
      setLoading(true)
      const data = await getMyMembership()
      setMembershipInfo(data)
    } catch (error) {
      console.error('Error fetching membership info:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg mb-6">
        <div className="animate-pulse">Ачааллаж байна...</div>
      </div>
    )
  }

  if (!membershipInfo) {
    return null
  }

  const { membership, subscriptionEndDate, isSubscriptionActive, publishedCount, maxPosts, remainingPosts, canPost } = membershipInfo

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Тодорхойгүй'
    const date = new Date(dateString)
    return date.toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysUntilExpiry = () => {
    if (!subscriptionEndDate) return 0
    const end = new Date(subscriptionEndDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const daysUntilExpiry = getDaysUntilExpiry()
  const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0
  const isExpired = !isSubscriptionActive

  return (
    <div className={`rounded-lg mb-6 p-4 ${
      isExpired 
        ? 'bg-gradient-to-r from-red-500 to-red-600' 
        : isExpiringSoon 
        ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
        : 'bg-gradient-to-r from-blue-500 to-purple-600'
    } text-white`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold">
              {membership?.name || 'FREE гишүүнчлэл'}
            </h3>
            {isExpired && (
              <span className="bg-red-700 px-2 py-1 rounded text-xs font-semibold">
                Хугацаа дууссан
              </span>
            )}
            {isExpiringSoon && !isExpired && (
              <span className="bg-yellow-600 px-2 py-1 rounded text-xs font-semibold">
                {daysUntilExpiry} хоног үлдлээ
              </span>
            )}
          </div>
          
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Нийтэлсэн:</span>
              <span>{publishedCount} / {maxPosts}</span>
            </div>
            {canPost && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Үлдсэн:</span>
                <span>{remainingPosts} файл</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-semibold">Хугацаа дуусах:</span>
              <span>{formatDate(subscriptionEndDate)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!canPost && (
            <div className="text-sm bg-white/20 px-3 py-1 rounded">
              {isExpired 
                ? 'Хугацаа дууссан. Сунгах шаардлагатай.' 
                : 'Хязгаарт хүрсэн. Шинэчлэх шаардлагатай.'}
            </div>
          )}
          <button
            onClick={() => router.push('/account/memberships')}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            {isExpired ? 'Сунгах' : 'Шинэчлэх'}
          </button>
        </div>
      </div>
    </div>
  )
}

