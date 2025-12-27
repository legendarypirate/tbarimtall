'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const userParam = searchParams.get('user')
    const error = searchParams.get('error')

    if (error) {
      // Handle error
      console.error('Authentication error:', error)
      router.push('/login?error=' + error)
      return
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam))
        
        // Store token and user data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        // Redirect based on user role
        if (user.role === 'journalist') {
          router.push('/account/journalist')
        } else {
          router.push('/')
        }
      } catch (err) {
        console.error('Error parsing user data:', err)
        router.push('/login?error=parse_error')
      }
    } else {
      router.push('/login?error=missing_data')
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Нэвтэрч байна...</p>
      </div>
    </div>
  )
}

