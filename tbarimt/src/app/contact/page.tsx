'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

export default function ContactPage() {
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
      <Header />

     
      {/* Contact Section */}
      <section className="w-full px-3 sm:px-4 lg:container lg:mx-auto py-8 bg-white dark:bg-gray-900">

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white border-2 border-[#004e6c]/20 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold text-[#004e6c] mb-4">
              Мессеж илгээх
            </h3>
            
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-400 rounded-xl text-green-700 font-medium">
                Мессеж амжилттай илгээгдлээ! Бид удахгүй танд хариу өгөх болно.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="space-y-4">
            <div className="bg-white border-2 border-[#004e6c]/20 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-[#004e6c] mb-4">
                Холбоо барих мэдээлэл
              </h3>
              
              <div className="space-y-4">
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
                      9300-0022
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

            <div className="bg-gradient-to-br from-[#004e6c] to-[#006b8f] rounded-xl p-6 text-white shadow-xl">
              <h3 className="text-xl font-bold mb-3">Шууд хариу авах</h3>
              <p className="mb-4 text-white/90 font-medium text-sm">
                Яаралтай асуулт байвал бидэнтэй шууд утсаар холбогдоорой. Бид танд туслахдаа баяртай байх болно.
              </p>
              <a
                href="tel:93000022"
                className="inline-block bg-white text-[#004e6c] px-5 py-2 rounded-lg font-semibold hover:bg-[#ff6b35] hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
              >
                Одоо залгах
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

