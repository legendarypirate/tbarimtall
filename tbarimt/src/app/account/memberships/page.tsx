'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getActiveMemberships, getMyMembership } from '@/lib/api'

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
  subscriptionEndDate: string | null
  isSubscriptionActive: boolean
  publishedCount: number
  maxPosts: number
}

export default function MembershipsPage() {
  const router = useRouter()
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [myMembership, setMyMembership] = useState<MyMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMembership, setSelectedMembership] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
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

  const handleSelectMembership = (membershipId: number) => {
    setSelectedMembership(membershipId)
    // Here you would typically redirect to payment page
    // For now, we'll just show a message
    alert('Төлбөрийн хуудас руу шилжиж байна...')
    // TODO: Implement payment flow
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
                      disabled
                      className="w-full bg-gray-300 text-gray-600 py-2 rounded-lg font-semibold cursor-not-allowed"
                    >
                      Одоогийн гишүүнчлэл
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectMembership(membership.id)}
                      className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                        isFree
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isFree ? 'Сонгох' : 'Сонгох'}
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
    </div>
  )
}

