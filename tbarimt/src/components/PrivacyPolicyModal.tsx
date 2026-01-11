'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface PrivacyPolicyModalProps {
  isOpen: boolean
  onAccept: () => void
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export default function PrivacyPolicyModal({ isOpen, onAccept }: PrivacyPolicyModalProps) {
  const { language } = useLanguage()
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPrivacyAccepted(false)
      setError(null)
      setIsSubmitting(false)
    }
  }, [isOpen])

  const handleAccept = async () => {
    if (!privacyAccepted) {
      setError(language === 'mn' 
        ? 'Та нууцлалын бодлогыг зөвшөөрөх ёстой' 
        : 'You must accept the privacy policy')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_BASE_URL}/auth/accept-privacy-policy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to accept privacy policy')
      }

      const data = await response.json()
      
      // Update user in localStorage
      if (data.user) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({ ...currentUser, privacyAccepted: true }))
      }

      onAccept()
    } catch (err: any) {
      console.error('Error accepting privacy policy:', err)
      setError(err.message || (language === 'mn' 
        ? 'Алдаа гарлаа. Дахин оролдоно уу.' 
        : 'An error occurred. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4 min-h-screen"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Content */}
        <div className="text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-[#004e6c] dark:text-gray-200 mb-2">
            {language === 'mn' ? 'Нууцлалын бодлого' : 'Privacy Policy'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {language === 'mn' 
              ? 'Үргэлжлүүлэхийн тулд та нууцлалын бодлогыг зөвшөөрөх ёстой' 
              : 'You must accept the privacy policy to continue'}
          </p>

          {/* Privacy Policy Checkbox */}
          <div className="mb-6 flex items-start space-x-3 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <input
              type="checkbox"
              id="privacy-policy-accept"
              checked={privacyAccepted}
              onChange={(e) => {
                setPrivacyAccepted(e.target.checked)
                setError(null)
              }}
              className="mt-1 w-5 h-5 text-[#004e6c] border-gray-300 rounded focus:ring-[#004e6c] focus:ring-2 cursor-pointer"
            />
            <label
              htmlFor="privacy-policy-accept"
              className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1 text-left"
            >
              {language === 'mn' 
                ? 'Би нууцлалын бодлогыг уншиж, зөвшөөрч байна' 
                : 'I have read and agree to the Privacy Policy'}
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Accept Button */}
          <button
            onClick={handleAccept}
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-[#004e6c] hover:bg-[#003d56] dark:bg-[#006b8f] dark:hover:bg-[#005a7a] text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting 
              ? (language === 'mn' ? 'Хадгалж байна...' : 'Saving...')
              : (language === 'mn' ? 'Зөвшөөрөх' : 'Accept')
            }
          </button>
        </div>
      </div>
    </div>
  )
}

