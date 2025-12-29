'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Helper function to get the base API URL without /api suffix
const getBaseApiUrl = () => {
  const url = API_URL.trim()
  // Remove trailing /api if present
  if (url.endsWith('/api')) {
    return url.slice(0, -4)
  }
  return url
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError('Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.')
    }
  }, [searchParams])

  const handleGoogleLogin = () => {
    setIsLoading(true)
    setError(null)
    // Redirect to backend Google OAuth endpoint
    // Ensure we don't double up on /api
    const baseUrl = getBaseApiUrl()
    window.location.href = `${baseUrl}/api/auth/google`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full mb-4">
              <span className="text-3xl">🛒</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Нэвтрэх
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Контент нийтлэхэд Google-аар нэвтрэнэ үү
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Нэвтэрч байна...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Google-аар нэвтрэх</span>
                </>
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  эсвэл
                </span>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => router.push('/')}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Нүүр хуудас руу буцах
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Нэвтэрснээр та манай{' '}
              <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                Үйлчилгээний нөхцөл
              </a>{' '}
              болон{' '}
              <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                Нууцлалын бодлого
              </a>{' '}
              зөвшөөрч байна.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

