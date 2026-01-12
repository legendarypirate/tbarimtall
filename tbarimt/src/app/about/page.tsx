'use client'

import { useRouter } from 'next/navigation'
import { useDarkMode } from '@/hooks/useDarkMode'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

export default function AboutPage() {
  const router = useRouter()
  const { isDark } = useDarkMode()

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      {/* Hero Section */}
      <section className="relative w-full py-24 md:py-32 overflow-hidden bg-gradient-to-br from-[#004e6c]/5 dark:from-[#004e6c]/10 via-white dark:via-gray-900 to-[#ff6b35]/5 dark:to-[#ff6b35]/10">
        {/* Abstract background graphics */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-[#004e6c]/15 dark:bg-[#004e6c]/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#ff6b35]/15 dark:bg-[#ff6b35]/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#004e6c] dark:text-gray-200 mb-6 leading-tight tracking-tight">
              Бидний тухай
            </h2>
            <p className="text-xl md:text-2xl text-[#004e6c]/70 dark:text-gray-400 mb-12 max-w-3xl mx-auto font-medium">
              TBARIMT - Бүх төрлийн контент нэг дороос
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white dark:bg-gray-900">
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 group">
            <div className="w-16 h-16 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] dark:group-hover:from-[#ff8555] dark:group-hover:to-[#ff6b35] transition-all duration-300">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="text-2xl font-bold text-[#004e6c] dark:text-gray-200 mb-4 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
              Бидний зорилго
            </h3>
            <p className="text-[#004e6c]/70 dark:text-gray-400 leading-relaxed font-medium">
              Манай платформ нь оюутнууд, мэргэжилтнүүд болон бүх хэрэглэгчдэд чанартай контент хүртээмжтэй болгох зорилготой. Реферат, дипломын ажил, тоглоом, програм хангамж зэрэг бүх төрлийн контент нэг дороос олох боломжийг бүрдүүлж байна.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 group">
            <div className="w-16 h-16 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] dark:group-hover:from-[#ff8555] dark:group-hover:to-[#ff6b35] transition-all duration-300">
              <span className="text-3xl">💡</span>
            </div>
            <h3 className="text-2xl font-bold text-[#004e6c] dark:text-gray-200 mb-4 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
              Бидний үнэт зүйлс
            </h3>
            <p className="text-[#004e6c]/70 dark:text-gray-400 leading-relaxed font-medium">
              Чанар, найдвартай байдал, хүртээмжтэй байдал нь бидний үндсэн үнэт зүйлс. Бид хэрэглэгчдэдээ хамгийн сайн үйлчилгээ үзүүлэх, чанартай контент нийлүүлэх, мөн контент бүтээгчдэд шударга орлого олох боломжийг бүрдүүлэхэд анхаарч байна.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-[#004e6c] dark:text-gray-200 mb-12 text-center">
            Яагаад биднийг сонгох вэ?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-2xl mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] dark:group-hover:from-[#ff8555] dark:group-hover:to-[#ff6b35] transition-all duration-300">
                <span className="text-4xl">📚</span>
              </div>
              <h4 className="text-xl font-bold text-[#004e6c] dark:text-gray-200 mb-3 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
                Олон төрлийн контент
              </h4>
              <p className="text-[#004e6c]/70 dark:text-gray-400 font-medium">
                Реферат, дипломын ажил, тоглоом, програм хангамж зэрэг бүх төрлийн контент
              </p>
            </div>

            <div className="text-center bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-2xl mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] dark:group-hover:from-[#ff8555] dark:group-hover:to-[#ff6b35] transition-all duration-300">
                <span className="text-4xl">⭐</span>
              </div>
              <h4 className="text-xl font-bold text-[#004e6c] dark:text-gray-200 mb-3 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
                Чанартай бүтээгдэхүүн
              </h4>
              <p className="text-[#004e6c]/70 dark:text-gray-400 font-medium">
                Бүх бүтээгдэхүүн манай мэргэжлийн баг шалгаж баталгаажуулдаг
              </p>
            </div>

            <div className="text-center bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-2xl mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] dark:group-hover:from-[#ff8555] dark:group-hover:to-[#ff6b35] transition-all duration-300">
                <span className="text-4xl">🚀</span>
              </div>
              <h4 className="text-xl font-bold text-[#004e6c] dark:text-gray-200 mb-3 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
                Хурдан хүргэлт
              </h4>
              <p className="text-[#004e6c]/70 dark:text-gray-400 font-medium">
                Худалдаж авсны дараа шууд татаж авах боломжтой
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-br from-[#004e6c] to-[#006b8f] rounded-2xl p-12 text-white text-center shadow-2xl mb-16">
          <h3 className="text-2xl md:text-3xl font-bold mb-10">Манай амжилтууд</h3>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="text-4xl md:text-5xl font-bold mb-2">1000+</div>
              <div className="text-white/90 font-medium">Бүтээгдэхүүн</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="text-4xl md:text-5xl font-bold mb-2">5000+</div>
              <div className="text-white/90 font-medium">Хэрэглэгч</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="text-4xl md:text-5xl font-bold mb-2">50+</div>
              <div className="text-white/90 font-medium">Нийтлэлч</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="text-4xl md:text-5xl font-bold mb-2">4.8</div>
              <div className="text-white/90 font-medium">Дундаж үнэлгээ</div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mt-16">
          <h3 className="text-2xl md:text-3xl font-bold text-[#004e6c] dark:text-gray-200 mb-8 text-center">
            Манай баг
          </h3>
          <p className="text-center text-[#004e6c]/70 dark:text-gray-400 max-w-3xl mx-auto mb-12 font-medium text-lg">
            Бид туршлагатай, мэргэжлийн багтай бөгөөд хэрэглэгчдэдээ хамгийн сайн үйлчилгээ үзүүлэхэд зориулж ажиллаж байна.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}

