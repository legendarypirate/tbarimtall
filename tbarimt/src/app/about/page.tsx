'use client'

import { useRouter } from 'next/navigation'
import { useDarkMode } from '@/hooks/useDarkMode'

export const dynamic = 'force-dynamic'

export default function AboutPage() {
  const router = useRouter()
  const { isDark } = useDarkMode()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Нүүр</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Бидний тухай
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Бидний тухай
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            tbarimt - Бүх төрлийн контент нэг дороос
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Бидний зорилго
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Манай платформ нь оюутнууд, мэргэжилтнүүд болон бүх хэрэглэгчдэд чанартай контент хүртээмжтэй болгох зорилготой. Реферат, дипломын ажил, тоглоом, програм хангамж зэрэг бүх төрлийн контент нэг дороос олох боломжийг бүрдүүлж байна.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="text-5xl mb-4">💡</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Бидний үнэт зүйлс
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Чанар, найдвартай байдал, хүртээмжтэй байдал нь бидний үндсэн үнэт зүйлс. Бид хэрэглэгчдэдээ хамгийн сайн үйлчилгээ үзүүлэх, чанартай контент нийлүүлэх, мөн контент бүтээгчдэд шударга орлого олох боломжийг бүрдүүлэхэд анхаарч байна.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Яагаад биднийг сонгох вэ?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                <span className="text-3xl">📚</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Олон төрлийн контент
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Реферат, дипломын ажил, тоглоом, програм хангамж зэрэг бүх төрлийн контент
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                <span className="text-3xl">⭐</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Чанартай бүтээгдэхүүн
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Бүх бүтээгдэхүүн манай мэргэжлийн баг шалгаж баталгаажуулдаг
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mb-4">
                <span className="text-3xl">🚀</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Хурдан хүргэлт
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Худалдаж авсны дараа шууд татаж авах боломжтой
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white text-center">
          <h3 className="text-3xl font-bold mb-8">Манай амжилтууд</h3>
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-blue-100">Бүтээгдэхүүн</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5000+</div>
              <div className="text-blue-100">Хэрэглэгч</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-blue-100">Нийтлэлч</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.8</div>
              <div className="text-blue-100">Дундаж үнэлгээ</div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mt-16">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Манай баг
          </h3>
          <p className="text-center text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-12">
            Бид туршлагатай, мэргэжлийн багтай бөгөөд хэрэглэгчдэдээ хамгийн сайн үйлчилгээ үзүүлэхэд зориулж ажиллаж байна.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h5 className="text-white font-semibold mb-4">tbarimt</h5>
              <p className="text-sm">
                Бүх төрлийн контент нэг дороос. Чанартай, найдвартай бүтээгдэхүүн.
              </p>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">Холбоос</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => router.push('/')}
                    className="hover:text-white transition-colors"
                  >
                    Нүүр
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => router.push('/products')}
                    className="hover:text-white transition-colors"
                  >
                    Бүтээгдэхүүн
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => router.push('/about')}
                    className="hover:text-white transition-colors"
                  >
                    Бидний тухай
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">Тусламж</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => router.push('/contact')}
                    className="hover:text-white transition-colors"
                  >
                    Холбоо барих
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-4">Холбоо барих</h5>
              <ul className="space-y-2 text-sm">
                <li>📧 info@tbarimt.mn</li>
                <li>📱 9911-2233</li>
                <li>📍 Улаанбаатар хот</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2024 tbarimt. Бүх эрх хуулиар хамгаалагдсан.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

