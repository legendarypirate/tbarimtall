'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getJournalistById, followJournalist, unfollowJournalist, createJournalistReview } from '@/lib/api'

export const dynamic = 'force-dynamic'

export default function JournalistProfile() {
  const params = useParams()
  const router = useRouter()
  const journalistId = params?.id as string
  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products')
  const [journalist, setJournalist] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowingLoading, setIsFollowingLoading] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [userReview, setUserReview] = useState<any>(null)

  useEffect(() => {
    const fetchJournalist = async () => {
      if (!journalistId) {
        setError('Journalist ID is required')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await getJournalistById(journalistId)
        if (response.journalist) {
          setJournalist(response.journalist)
          setIsFollowing(response.journalist.isFollowing || false)
          // Always allow new reviews, so hasReviewed is always false
          setHasReviewed(false)
          setUserReview(response.journalist.userReview || null)
          // Don't populate form with existing review - allow fresh review each time
          setReviewRating(5)
          setReviewComment('')
        } else {
          setError('Journalist not found')
        }
      } catch (error: any) {
        console.error('Error fetching journalist:', error)
        setError(error.message || 'Failed to load journalist profile')
      } finally {
        setLoading(false)
      }
    }

    fetchJournalist()
  }, [journalistId])

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString('mn-MN')
  }

  const handleFollow = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      alert('Нэвтрэх шаардлагатай')
      router.push('/login')
      return
    }

    try {
      setIsFollowingLoading(true)
      if (isFollowing) {
        await unfollowJournalist(journalistId)
        setIsFollowing(false)
        setJournalist((prev: any) => ({
          ...prev,
          followers: Math.max(0, (prev.followers || 0) - 1)
        }))
      } else {
        const response = await followJournalist(journalistId)
        setIsFollowing(true)
        setJournalist((prev: any) => ({
          ...prev,
          followers: response.followers || (prev.followers || 0) + 1
        }))
      }
    } catch (error: any) {
      console.error('Error following/unfollowing:', error)
      alert(error.message || 'Алдаа гарлаа')
    } finally {
      setIsFollowingLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      alert('Нэвтрэх шаардлагатай')
      router.push('/login')
      return
    }

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      alert('Үнэлгээ сонгоно уу')
      return
    }

    try {
      setIsSubmittingReview(true)
      const response = await createJournalistReview(journalistId, {
        rating: reviewRating,
        comment: reviewComment || undefined
      })
      
      // Refresh journalist data
      const updatedResponse = await getJournalistById(journalistId)
      if (updatedResponse.journalist) {
        setJournalist(updatedResponse.journalist)
        // Always allow new reviews, so hasReviewed is always false
        setHasReviewed(false)
        // Update userReview to show the most recent review
        setUserReview(updatedResponse.journalist.userReview || null)
      }
      
      // Reset form
      setReviewRating(5)
      setReviewComment('')
      alert('Үнэлгээ амжилттай илгээгдлээ')
    } catch (error: any) {
      console.error('Error submitting review:', error)
      // Extract error message properly
      const errorMessage = error.message || error.error || 'Алдаа гарлаа'
      alert(errorMessage)
    } finally {
      setIsSubmittingReview(false)
    }
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

  if (error || !journalist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Нийтлэлч олдсонгүй'}
          </h2>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Нүүр хуудас руу буцах
          </button>
        </div>
      </div>
    )
  }

  const user = journalist.user || {}
  const products = journalist.products || []
  const reviews = journalist.reviews || []

  // Check if user is Google author (username starts with "google_")
  const isGoogleAuthor = user.username?.startsWith('google_')
  
  // Generate avatar URL: use actual avatar if Google author and has avatar, otherwise use DiceBear
  const getAvatarUrl = () => {
    if (isGoogleAuthor && user.avatar) {
      return user.avatar
    }
    // Use DiceBear API for professional initials avatar
    const seed = user.fullName || user.email || user.username || user.id || 'default'
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`
  }

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
              Нийтлэлчийн профайл
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative">
              <img
                src={getAvatarUrl()}
                alt={user.fullName || user.username || 'Journalist'}
                className="w-32 h-32 rounded-full border-4 border-blue-500 dark:border-blue-400 shadow-lg"
                onError={(e) => {
                  // Fallback to DiceBear if image fails to load
                  const seed = user.fullName || user.email || user.username || user.id || 'default'
                  ;(e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`
                }}
              />
              {/* Membership Badge in corner */}
              {(() => {
                const getMembershipName = () => {
                  const membershipName = user.membership?.name || '';
                  if (membershipName) {
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

                const getMembershipBadgeColor = (name: string) => {
                  const upperName = name.toUpperCase();
                  if (upperName.includes('PLATINUM')) return 'bg-cyan-500 text-white';
                  if (upperName.includes('GOLD')) return 'bg-yellow-500 text-white';
                  if (upperName.includes('SILVER')) return 'bg-slate-500 text-white';
                  if (upperName.includes('BRONZE')) return 'bg-orange-600 text-white';
                  return 'bg-gray-500 text-white';
                };

                const membershipName = getMembershipName();
                const badgeColor = getMembershipBadgeColor(membershipName);
                
                return (
                  <div className={`absolute -bottom-1 -right-1 ${badgeColor} text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white dark:border-gray-800 z-20 uppercase`}>
                    {membershipName}
                  </div>
                );
              })()}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {user.fullName || user.username || 'Unknown'}
                </h2>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                @{user.username || 'unknown'}
              </p>
              {journalist.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {journalist.bio}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                {journalist.specialty && (
                  <span className="flex items-center space-x-1">
                    <span>🎯</span>
                    <span>{journalist.specialty}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <div className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-lg">
                <span className="text-yellow-600 dark:text-yellow-400 text-xl">⭐</span>
                <span className="font-bold text-yellow-700 dark:text-yellow-300">
                  {journalist.rating ? (typeof journalist.rating === 'number' ? journalist.rating.toFixed(1) : parseFloat(journalist.rating || 0).toFixed(1)) : '0.0'}
                </span>
              </div>
              <button 
                onClick={handleFollow}
                disabled={isFollowingLoading}
                className={`px-6 py-2 rounded-lg transition-all font-semibold shadow-md ${
                  isFollowing
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                } ${isFollowingLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isFollowingLoading ? 'Ачааллаж байна...' : isFollowing ? 'Дагаж байна' : 'Дагах'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatNumber(journalist.followers || 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Дагагчид</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {journalist.posts || products.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Нийтлэл</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatNumber(products.reduce((sum: number, p: any) => sum + (p.views || 0), 0))}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Нийт үзсэн</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatNumber(products.reduce((sum: number, p: any) => sum + (p.downloads || 0), 0))}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Татсан тоо</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-4 px-6">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-2 border-b-2 font-semibold transition-colors ${
                  activeTab === 'products'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Бүтээгдэхүүн ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-2 border-b-2 font-semibold transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Үнэлгээ ({reviews.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'products' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.length > 0 ? products.map((product: any) => (
                  <div
                    key={product.id}
                    onClick={() => router.push(`/products/${product.uuid || product.id}`)}
                    className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1"
                  >
                    <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 flex items-center space-x-1 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-full">
                        <span className="text-yellow-400 text-sm">⭐</span>
                        <span className="text-xs font-semibold">{product.rating}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {product.title}
                      </h4>
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>
                          {typeof product.category === 'object' && product.category?.name
                            ? product.category.name
                            : typeof product.category === 'string'
                            ? product.category
                            : 'N/A'}
                        </span>
                        <span>⬇️ {product.downloads || 0}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {parseFloat(product.price || 0).toLocaleString()}₮
                        </span>
                        {product.createdAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(product.createdAt).toLocaleDateString('mn-MN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">
                      Бүтээгдэхүүн олдсонгүй
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Review Form - Always show, allow multiple reviews */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Үнэлгээ үлдээх
                  </h3>
                  {userReview && (
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-2 font-medium">
                        Таны сүүлд өгсөн үнэлгээ:
                      </p>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={i < userReview.rating ? 'text-yellow-400' : 'text-gray-300'}
                            >
                              ⭐
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {userReview.date}
                        </span>
                      </div>
                      {userReview.comment && (
                        <p className="text-gray-700 dark:text-gray-300 mt-2 text-sm">{userReview.comment}</p>
                      )}
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Үнэлгээ
                      </label>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setReviewRating(rating)}
                            className={`text-2xl transition-transform hover:scale-110 ${
                              rating <= reviewRating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ⭐
                          </button>
                        ))}
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          {reviewRating} / 5
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Сэтгэгдэл (сонголттой)
                      </label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Сэтгэгдлээ бичнэ үү..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                      />
                    </div>
                    <button
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingReview ? 'Илгээж байна...' : 'Үнэлгээ илгээх'}
                    </button>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.length > 0 ? reviews.map((review: any) => (
                    <div
                      key={review.id}
                      className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start space-x-4">
                        <img
                          src={review.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${review.user}`}
                          alt={review.user}
                          className="w-12 h-12 rounded-full"
                          onError={(e) => {
                            const seed = review.user || 'default'
                            ;(e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {review.user}
                              </h4>
                              <div className="flex items-center space-x-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                                  >
                                    ⭐
                                  </span>
                                ))}
                              </div>
                            </div>
                            <span className="text-sm text-gray-500">{review.date}</span>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12">
                      <p className="text-gray-600 dark:text-gray-400">
                        Үнэлгээ олдсонгүй
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


