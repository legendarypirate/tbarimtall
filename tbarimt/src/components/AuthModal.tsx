'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getTranslation } from '@/lib/translations'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectGoogle: () => void
  onSelectFacebook: () => void
}

export default function AuthModal({ isOpen, onClose, onSelectGoogle, onSelectFacebook }: AuthModalProps) {
  const { language } = useLanguage()

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

  if (!isOpen) return null

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const baseUrl = API_URL.trim().endsWith('/api') 
    ? API_URL.trim().slice(0, -4) 
    : API_URL.trim()

  const handleGoogleAuth = () => {
    onSelectGoogle()
    onClose() // Close modal before redirecting
    // Mark that OAuth flow has started with timestamp
    sessionStorage.setItem('oauth_flow_started', 'true')
    sessionStorage.setItem('oauth_flow_timestamp', Date.now().toString())
    window.location.href = `${baseUrl}/api/auth/google`
  }

  const handleFacebookAuth = () => {
    onSelectFacebook()
    onClose() // Close modal before redirecting
    // Mark that OAuth flow has started with timestamp
    sessionStorage.setItem('oauth_flow_started', 'true')
    sessionStorage.setItem('oauth_flow_timestamp', Date.now().toString())
    window.location.href = `${baseUrl}/api/auth/facebook`
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4 min-h-screen"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Content */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#004e6c] dark:text-gray-200 mb-2">
            {language === 'mn' ? 'Нэвтрэх арга сонгох' : 'Choose Login Method'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {language === 'mn' 
              ? 'Нийтлэл оруулахын тулд нэвтрэх аргаа сонгоно уу' 
              : 'Please choose a login method to upload content'}
          </p>

          {/* Auth Buttons */}
          <div className="space-y-4">
            {/* Google Button */}
            <button
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 shadow-md bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-[#4285F4] dark:hover:border-[#4285F4] hover:bg-gray-50 dark:hover:bg-gray-600 hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-gray-700 dark:text-gray-200 font-semibold text-lg">
                {language === 'mn' ? 'Google-аар нэвтрэх' : 'Continue with Google'}
              </span>
            </button>

            {/* Facebook Button */}
            <button
              onClick={handleFacebookAuth}
              className="w-full flex items-center justify-center space-x-3 px-6 py-4 text-white rounded-xl transition-all duration-300 shadow-md bg-[#1877F2] dark:bg-[#1877F2] hover:bg-[#166FE5] dark:hover:bg-[#166FE5] hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="font-semibold text-lg">
                {language === 'mn' ? 'Facebook-аар нэвтрэх' : 'Continue with Facebook'}
              </span>
            </button>

            {/* Phone Login Button (Disabled) */}
            <button
              disabled
              className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-xl cursor-not-allowed opacity-60 transition-all duration-300 shadow-md"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              <span className="font-semibold text-lg">
                Утсаар нэвтрэх
              </span>
            </button>
          </div>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="mt-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-sm font-medium"
          >
            {language === 'mn' ? 'Цуцлах' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

