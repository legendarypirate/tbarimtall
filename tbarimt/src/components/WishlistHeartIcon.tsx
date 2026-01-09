'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { addToWishlist, removeFromWishlist, checkWishlist } from '@/lib/api'
import toast from 'react-hot-toast'

interface WishlistHeartIconProps {
  productId: number | string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  onToggle?: (isInWishlist: boolean) => void
}

export default function WishlistHeartIcon({ 
  productId, 
  className = '', 
  size = 'md',
  onToggle 
}: WishlistHeartIconProps) {
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const isProcessingRef = useRef(false)

  // Check authentication
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    setIsAuthenticated(!!token)
  }, [])

  const checkWishlistStatus = useCallback(async () => {
    if (!isAuthenticated || !productId) {
      setIsInWishlist(false)
      return
    }
    try {
      const response = await checkWishlist(productId)
      setIsInWishlist(response.isInWishlist || false)
    } catch (error) {
      // User not authenticated or error - set to false
      console.error('Error checking wishlist status:', error)
      setIsInWishlist(false)
    }
  }, [isAuthenticated, productId])

  // Check wishlist status on mount
  useEffect(() => {
    if (isAuthenticated && productId) {
      checkWishlistStatus()
    }
  }, [productId, isAuthenticated, checkWishlistStatus])

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Prevent multiple rapid clicks
    if (isProcessingRef.current || isLoading) {
      return
    }

    if (!isAuthenticated) {
      // Redirect to login or show message
      if (typeof window !== 'undefined') {
        const shouldLogin = confirm('Хүслийн жагсаалтад нэмэхийн тулд нэвтрэх шаардлагатай. Нэвтрэх үү?')
        if (shouldLogin) {
          window.location.href = '/account/login'
        }
      }
      return
    }

    isProcessingRef.current = true
    setIsLoading(true)
    try {
      if (isInWishlist) {
        await removeFromWishlist(productId)
        // Re-check status to ensure state is correct
        await checkWishlistStatus()
        onToggle?.(false)
        toast.success('Хасагдлаа', {
          icon: '❤️',
        })
      } else {
        try {
          await addToWishlist(productId)
          // Re-check status to ensure state is correct
          await checkWishlistStatus()
          onToggle?.(true)
          toast.success('Нэмэгдлээ', {
            icon: '❤️',
          })
        } catch (addError: any) {
          // If product is already in wishlist (400 error), just update state
          if (addError.message?.includes('already in wishlist') || addError.message?.includes('400')) {
            await checkWishlistStatus()
            onToggle?.(true)
            toast.success('Нэмэгдлээ', {
              icon: '❤️',
            })
          } else {
            throw addError
          }
        }
      }
    } catch (error: any) {
      console.error('Error toggling wishlist:', error)
      // Re-check status even on error to sync state
      await checkWishlistStatus()
      // Only show toast for unexpected errors
      if (!error.message?.includes('already in wishlist')) {
        toast.error(error.message || 'Алдаа гарлаа. Дахин оролдоно уу.')
      }
    } finally {
      setIsLoading(false)
      // Add a small delay before allowing another click to prevent rapid clicking
      setTimeout(() => {
        isProcessingRef.current = false
      }, 500)
    }
  }

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        ${className}
        transition-all duration-300
        ${isInWishlist 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-500'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        hover:scale-110 active:scale-95
        flex items-center justify-center
      `}
      aria-label={isInWishlist ? 'Хүслийн жагсаалтаас хасах' : 'Хүслийн жагсаалтад нэмэх'}
    >
      {isLoading ? (
        <svg className="animate-spin w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg
          className="w-full h-full"
          fill={isInWishlist ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
    </button>
  )
}

