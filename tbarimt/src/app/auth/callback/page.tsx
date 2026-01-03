'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)

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
        
        // Store token first
        localStorage.setItem('token', token)
        
        // Fetch latest user profile from server to ensure role is up to date
        fetch(`${API_BASE_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
          .then(res => res.json())
          .then(data => {
            if (data.user) {
              // Use server data which has the latest role
              localStorage.setItem('user', JSON.stringify(data.user))
              
              // Redirect based on user role
              if (data.user.role === 'journalist') {
                router.push('/account/journalist')
              } else {
                router.push('/')
              }
            } else {
              // Fallback to user data from callback if profile fetch fails
              localStorage.setItem('user', JSON.stringify(user))
              if (user.role === 'journalist') {
                router.push('/account/journalist')
              } else {
                router.push('/')
              }
            }
          })
          .catch(err => {
            console.error('Error fetching user profile:', err)
            // Fallback to user data from callback
            localStorage.setItem('user', JSON.stringify(user))
            if (user.role === 'journalist') {
              router.push('/account/journalist')
            } else {
              router.push('/')
            }
          })
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

