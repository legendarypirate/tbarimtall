'use client'

import { useRouter } from 'next/navigation'
import { useDarkMode } from '@/hooks/useDarkMode'

export const dynamic = 'force-dynamic'

export default function AboutPage() {
  const router = useRouter()
  const { isDark, toggle: toggleDarkMode } = useDarkMode()

  return (
    <main className="min-h-screen bg-white">
      {/* Top Header - Logo, Search, Upload/Dipbard */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#004e6c]/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => router.push('/')}>
              <div className="w-10 h-10 bg-[#004e6c] rounded-lg flex items-center justify-center shadow-lg group-hover:bg-[#ff6b35] group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                <span className="text-white font-bold text-xl">T</span>
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
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                <span className="text-white font-bold text-sm">T</span>
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
        {/* Abstract background graphics */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-[#004e6c]/15 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#ff6b35]/15 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#004e6c] mb-6 leading-tight tracking-tight">
              Бидний тухай
            </h2>
            <p className="text-xl md:text-2xl text-[#004e6c]/70 mb-12 max-w-3xl mx-auto font-medium">
              TBARIMT - Бүх төрлийн контент нэг дороос
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white border-2 border-[#004e6c]/20 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 group">
            <div className="w-16 h-16 bg-gradient-to-br from-[#004e6c] to-[#006b8f] rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] transition-all duration-300">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="text-2xl font-bold text-[#004e6c] mb-4 group-hover:text-[#ff6b35] transition-colors">
              Бидний зорилго
            </h3>
            <p className="text-[#004e6c]/70 leading-relaxed font-medium">
              Манай платформ нь оюутнууд, мэргэжилтнүүд болон бүх хэрэглэгчдэд чанартай контент хүртээмжтэй болгох зорилготой. Реферат, дипломын ажил, тоглоом, програм хангамж зэрэг бүх төрлийн контент нэг дороос олох боломжийг бүрдүүлж байна.
            </p>
          </div>

          <div className="bg-white border-2 border-[#004e6c]/20 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 group">
            <div className="w-16 h-16 bg-gradient-to-br from-[#004e6c] to-[#006b8f] rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] transition-all duration-300">
              <span className="text-3xl">💡</span>
            </div>
            <h3 className="text-2xl font-bold text-[#004e6c] mb-4 group-hover:text-[#ff6b35] transition-colors">
              Бидний үнэт зүйлс
            </h3>
            <p className="text-[#004e6c]/70 leading-relaxed font-medium">
              Чанар, найдвартай байдал, хүртээмжтэй байдал нь бидний үндсэн үнэт зүйлс. Бид хэрэглэгчдэдээ хамгийн сайн үйлчилгээ үзүүлэх, чанартай контент нийлүүлэх, мөн контент бүтээгчдэд шударга орлого олох боломжийг бүрдүүлэхэд анхаарч байна.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h3 className="text-3xl md:text-4xl font-extrabold text-[#004e6c] mb-12 text-center">
            Яагаад биднийг сонгох вэ?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center bg-white border-2 border-[#004e6c]/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#004e6c] to-[#006b8f] rounded-2xl mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] transition-all duration-300">
                <span className="text-4xl">📚</span>
              </div>
              <h4 className="text-xl font-bold text-[#004e6c] mb-3 group-hover:text-[#ff6b35] transition-colors">
                Олон төрлийн контент
              </h4>
              <p className="text-[#004e6c]/70 font-medium">
                Реферат, дипломын ажил, тоглоом, програм хангамж зэрэг бүх төрлийн контент
              </p>
            </div>

            <div className="text-center bg-white border-2 border-[#004e6c]/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#004e6c] to-[#006b8f] rounded-2xl mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] transition-all duration-300">
                <span className="text-4xl">⭐</span>
              </div>
              <h4 className="text-xl font-bold text-[#004e6c] mb-3 group-hover:text-[#ff6b35] transition-colors">
                Чанартай бүтээгдэхүүн
              </h4>
              <p className="text-[#004e6c]/70 font-medium">
                Бүх бүтээгдэхүүн манай мэргэжлийн баг шалгаж баталгаажуулдаг
              </p>
            </div>

            <div className="text-center bg-white border-2 border-[#004e6c]/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#004e6c] to-[#006b8f] rounded-2xl mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] transition-all duration-300">
                <span className="text-4xl">🚀</span>
              </div>
              <h4 className="text-xl font-bold text-[#004e6c] mb-3 group-hover:text-[#ff6b35] transition-colors">
                Хурдан хүргэлт
              </h4>
              <p className="text-[#004e6c]/70 font-medium">
                Худалдаж авсны дараа шууд татаж авах боломжтой
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-br from-[#004e6c] to-[#006b8f] rounded-2xl p-12 text-white text-center shadow-2xl mb-16">
          <h3 className="text-3xl md:text-4xl font-extrabold mb-10">Манай амжилтууд</h3>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="text-4xl md:text-5xl font-extrabold mb-2">1000+</div>
              <div className="text-white/90 font-medium">Бүтээгдэхүүн</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="text-4xl md:text-5xl font-extrabold mb-2">5000+</div>
              <div className="text-white/90 font-medium">Хэрэглэгч</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="text-4xl md:text-5xl font-extrabold mb-2">50+</div>
              <div className="text-white/90 font-medium">Нийтлэлч</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="text-4xl md:text-5xl font-extrabold mb-2">4.8</div>
              <div className="text-white/90 font-medium">Дундаж үнэлгээ</div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mt-16">
          <h3 className="text-3xl md:text-4xl font-extrabold text-[#004e6c] mb-8 text-center">
            Манай баг
          </h3>
          <p className="text-center text-[#004e6c]/70 max-w-3xl mx-auto mb-12 font-medium text-lg">
            Бид туршлагатай, мэргэжлийн багтай бөгөөд хэрэглэгчдэдээ хамгийн сайн үйлчилгээ үзүүлэхэд зориулж ажиллаж байна.
          </p>
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
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <span className="text-white font-bold text-lg">T</span>
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

