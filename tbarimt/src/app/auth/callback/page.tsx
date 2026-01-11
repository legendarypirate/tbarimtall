'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TermsAndConditionsModal from '@/components/TermsAndConditionsModal'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const token = searchParams.get('token')
    const userParam = searchParams.get('user')
    const error = searchParams.get('error')

    // Clear OAuth flow flag when callback is reached
    if (sessionStorage.getItem('oauth_flow_started')) {
      sessionStorage.removeItem('oauth_flow_started')
      sessionStorage.removeItem('oauth_flow_timestamp')
    }

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
        
        // Fetch latest user profile from server to ensure role and termsAccepted are up to date
        fetch(`${API_BASE_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
          .then(res => res.json())
          .then(data => {
            if (data.user) {
              // Use server data which has the latest role and termsAccepted status
              localStorage.setItem('user', JSON.stringify(data.user))
              
              // CRITICAL: Always check termsAccepted from server response
              // Do NOT redirect to journalist page if terms are not accepted
              if (!data.user.termsAccepted) {
                setUserData(data.user)
                setShowTermsModal(true)
                setLoading(false)
                // Do not redirect - user must accept terms first
                return
              }
              
              // Only redirect if terms are accepted
              setLoading(false)
              if (data.user.role === 'journalist') {
                router.push('/account/journalist')
              } else {
                router.push('/')
              }
            } else {
              // Fallback to user data from callback if profile fetch fails
              // But still check termsAccepted - if false, show modal
              localStorage.setItem('user', JSON.stringify(user))
              
              // Check if terms and conditions are accepted
              if (!user.termsAccepted) {
                setUserData(user)
                setShowTermsModal(true)
                setLoading(false)
                // Do not redirect - user must accept terms first
                return
              }
              
              // Only redirect if terms are accepted
              setLoading(false)
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
            // But still check termsAccepted - if false, show modal
            localStorage.setItem('user', JSON.stringify(user))
            
            // Check if terms and conditions are accepted
            if (!user.termsAccepted) {
              setUserData(user)
              setShowTermsModal(true)
              setLoading(false)
              // Do not redirect - user must accept terms first
              return
            }
            
            // Only redirect if terms are accepted
            setLoading(false)
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
      // If no token/user params, user likely navigated back or cancelled OAuth
      // Just redirect to home page instead of login to avoid loops
      setLoading(false)
      router.push('/')
    }
  }, [router, searchParams])

  const handleTermsAccepted = () => {
    setShowTermsModal(false)
    // Redirect based on user role
    if (userData?.role === 'journalist') {
      router.push('/account/journalist')
    } else {
      router.push('/')
    }
  }

  return (
    <>
      {loading && (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Нэвтэрч байна...</p>
          </div>
        </div>
      )}
      <TermsAndConditionsModal 
        isOpen={showTermsModal} 
        onAccept={handleTermsAccepted}
        showAcceptButton={true}
      />
    </>
  )
}

