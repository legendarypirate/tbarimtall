'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDarkMode } from '@/hooks/useDarkMode'

export const dynamic = 'force-dynamic'

export default function ContactPage() {
  const router = useRouter()
  const { isDark, toggle: toggleDarkMode } = useDarkMode()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitStatus('success')
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle')
      }, 5000)
    }, 1500)
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Top Header - Logo, Search, Upload/Dipbard */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#004e6c]/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => router.push('/')}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 overflow-hidden">
                <img src="/lg.png" alt="TBARIMT Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-bold text-[#004e6c] group-hover:text-[#ff6b35] transition-colors">
                TBARIMT
              </h1>
            </div>
            
            {/* Search Bar */}
            <div className="flex flex-1 max-w-md mx-4 md:mx-8">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-[#004e6c]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      router.push('/search')
                    }
                  }}
                  placeholder="Хайх..."
                  className="block w-full pl-12 pr-4 py-3 border-2 border-[#004e6c]/20 rounded-xl bg-white text-[#004e6c] placeholder-[#004e6c]/40 focus:outline-none focus:ring-2 focus:ring-[#004e6c]/30 focus:border-[#004e6c] text-sm font-medium transition-all shadow-sm hover:shadow-md"
                />
              </div>
            </div>
            
            {/* Upload and Dipbard Buttons */}
            <div className="flex items-center space-x-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2.5 rounded-xl text-[#004e6c] hover:bg-[#004e6c]/10 transition-all duration-200"
                aria-label="Toggle dark mode"
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              
              <button 
                onClick={() => {
                  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                  const baseUrl = API_URL.trim().endsWith('/api') 
                    ? API_URL.trim().slice(0, -4) 
                    : API_URL.trim()
                  window.location.href = `${baseUrl}/api/auth/google`
                }}
                className="bg-[#004e6c] text-white px-5 py-2.5 rounded-xl hover:bg-[#ff6b35] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Upload
              </button>
              
              <button 
                onClick={() => router.push('/dashboard')}
                className="bg-[#004e6c] text-white px-5 py-2.5 rounded-xl hover:bg-[#ff6b35] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Dipbard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Navigation Bar */}
      <nav className="bg-[#004e6c] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/lg.png" alt="TBARIMT Logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-lg font-bold text-white">
                TBARIMT
              </h2>
            </div>
            <div className="flex items-center space-x-8">
              <button 
                onClick={() => router.push('/products')}
                className="text-white/90 hover:text-white transition-colors font-semibold text-sm relative group"
              >
                Categories
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </button>
              <button 
                onClick={() => router.push('/about')}
                className="text-white/90 hover:text-white transition-colors font-semibold text-sm relative group"
              >
                How it Works
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </button>
              <button 
                onClick={() => router.push('/pricing')}
                className="text-white/90 hover:text-white transition-colors font-semibold text-sm relative group"
              >
                Pricing
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full py-24 md:py-32 overflow-hidden bg-gradient-to-br from-[#004e6c]/5 via-white to-[#ff6b35]/5">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-[#004e6c]/15 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#ff6b35]/15 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#004e6c] mb-6 leading-tight tracking-tight">
              Бидэнтэй холбогдоорой
            </h2>
            <p className="text-xl md:text-2xl text-[#004e6c]/70 mb-12 max-w-3xl mx-auto font-medium">
              Асуулт, санал хүсэлт, эсвэл тусламж хэрэгтэй бол бидэнтэй холбогдоно уу
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white">

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white border-2 border-[#004e6c]/20 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <h3 className="text-2xl font-bold text-[#004e6c] mb-6">
              Мессеж илгээх
            </h3>
            
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-400 rounded-xl text-green-700 font-medium">
                Мессеж амжилттай илгээгдлээ! Бид удахгүй танд хариу өгөх болно.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Нэр *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#004e6c]/20 bg-white text-[#004e6c] focus:outline-none focus:ring-2 focus:ring-[#004e6c]/30 focus:border-[#004e6c] transition-all font-medium"
                  placeholder="Таны нэр"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Имэйл *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#004e6c]/20 bg-white text-[#004e6c] focus:outline-none focus:ring-2 focus:ring-[#004e6c]/30 focus:border-[#004e6c] transition-all font-medium"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Утас
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#004e6c]/20 bg-white text-[#004e6c] focus:outline-none focus:ring-2 focus:ring-[#004e6c]/30 focus:border-[#004e6c] transition-all font-medium"
                  placeholder="9911-2233"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Сэдэв *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#004e6c]/20 bg-white text-[#004e6c] focus:outline-none focus:ring-2 focus:ring-[#004e6c]/30 focus:border-[#004e6c] transition-all font-medium"
                >
                  <option value="">Сэдвийг сонгоно уу</option>
                  <option value="general">Ерөнхий асуулт</option>
                  <option value="product">Бүтээгдэхүүний тухай</option>
                  <option value="technical">Техникийн тусламж</option>
                  <option value="payment">Төлбөрийн асуудал</option>
                  <option value="other">Бусад</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Мессеж *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#004e6c]/20 bg-white text-[#004e6c] focus:outline-none focus:ring-2 focus:ring-[#004e6c]/30 focus:border-[#004e6c] transition-all resize-none font-medium"
                  placeholder="Таны мессеж..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#004e6c] to-[#ff6b35] text-white py-4 rounded-xl font-semibold hover:from-[#006b8f] hover:to-[#ff8555] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Илгээж байна...
                  </span>
                ) : (
                  'Мессеж илгээх'
                )}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white border-2 border-[#004e6c]/20 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
              <h3 className="text-2xl font-bold text-[#004e6c] mb-6">
                Холбоо барих мэдээлэл
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#004e6c] to-[#006b8f] rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">📧</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#004e6c] mb-1">Имэйл</h4>
                    <a href="mailto:info@tbarimt.mn" className="text-[#004e6c] hover:text-[#ff6b35] hover:underline font-medium transition-colors">
                      info@tbarimt.mn
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#004e6c] to-[#006b8f] rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">📱</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#004e6c] mb-1">Утас</h4>
                    <a href="tel:99112233" className="text-[#004e6c] hover:text-[#ff6b35] hover:underline font-medium transition-colors">
                      9911-2233
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#004e6c] to-[#006b8f] rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">📍</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#004e6c] mb-1">Хаяг</h4>
                    <p className="text-[#004e6c]/70 font-medium">
                      Улаанбаатар хот, Монгол улс
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#004e6c] to-[#006b8f] rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">🕒</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#004e6c] mb-1">Ажлын цаг</h4>
                    <p className="text-[#004e6c]/70 font-medium">
                      Даваа - Баасан: 09:00 - 18:00<br />
                      Бямба, Ням: Амралтын өдөр
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#004e6c] to-[#006b8f] rounded-2xl p-8 text-white shadow-2xl">
              <h3 className="text-2xl font-bold mb-4">Шууд хариу авах</h3>
              <p className="mb-6 text-white/90 font-medium">
                Яаралтай асуулт байвал бидэнтэй шууд утсаар холбогдоорой. Бид танд туслахдаа баяртай байх болно.
              </p>
              <a
                href="tel:99112233"
                className="inline-block bg-white text-[#004e6c] px-6 py-3 rounded-xl font-semibold hover:bg-[#ff6b35] hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Одоо залгах
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#004e6c] mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Navigation Links Row */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mb-10">
            <button 
              onClick={() => router.push('/terms')}
              className="text-white/90 hover:text-white transition-colors text-sm font-semibold relative group"
            >
              Terms
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </button>
            <button 
              onClick={() => router.push('/privacy')}
              className="text-white/90 hover:text-white transition-colors text-sm font-semibold relative group"
            >
              Privacy Policy
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </button>
            <button 
              onClick={() => router.push('/about')}
              className="text-white/90 hover:text-white transition-colors text-sm font-semibold relative group"
            >
              How It Works
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </button>
            <button 
              onClick={() => router.push('/pricing')}
              className="text-white/90 hover:text-white transition-colors text-sm font-semibold relative group"
            >
              Pricing
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </button>
            <button 
              onClick={() => router.push('/help')}
              className="text-white/90 hover:text-white transition-colors text-sm font-semibold relative group"
            >
              Help
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </button>
            <button 
              onClick={() => router.push('/mby')}
              className="text-white/90 hover:text-white transition-colors text-sm font-semibold relative group"
            >
              Mby
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </button>
            <button 
              onClick={() => router.push('/search')}
              className="text-white/90 hover:text-white transition-colors text-sm font-semibold relative group"
            >
              Q
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </button>
          </div>
          
          {/* Logo at Bottom Left */}
          <div className="flex items-center space-x-3 pt-8 border-t border-white/20">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
              <img src="/lg.png" alt="TBARIMT Logo" className="w-full h-full object-contain" />
            </div>
            <h5 className="text-2xl font-extrabold text-white">
              TBARIMT
            </h5>
          </div>
        </div>
      </footer>
    </main>
  )
}

