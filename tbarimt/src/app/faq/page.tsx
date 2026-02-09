'use client'

import { useState, useEffect } from 'react'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useLanguage } from '@/contexts/LanguageContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getFAQs } from '@/lib/api'

export const dynamic = 'force-dynamic'

interface FAQItem {
  id: number
  question: {
    mn: string
    en: string
  }
  answer: {
    mn: string
    en: string
  }
  order: number
  isActive: boolean
}

export default function FAQPage() {
  const { isDark } = useDarkMode()
  const { language } = useLanguage()
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [faqData, setFaqData] = useState<FAQItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await getFAQs()
        if (response.faqs && Array.isArray(response.faqs)) {
          setFaqData(response.faqs)
          // Open first FAQ by default if available
          if (response.faqs.length > 0) {
            setOpenIndex(0)
          }
        } else {
          throw new Error('Invalid FAQ response format')
        }
      } catch (err) {
        console.error('Error fetching FAQs:', err)
        setError(err instanceof Error ? err.message : 'Failed to load FAQs')
        // Set empty array on error so page still renders
        setFaqData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchFAQs()
  }, [])

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white dark:bg-gray-900">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004e6c]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <p className="text-sm text-red-600 dark:text-red-300 mt-2">
              {language === 'mn' ? 'Асуулт-хариултуудыг ачаалж чадсангүй. Дахин оролдоно уу.' : 'Failed to load FAQs. Please try again.'}
            </p>
          </div>
        ) : faqData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {language === 'mn' ? 'Одоогоор асуулт-хариулт байхгүй байна.' : 'No FAQs available at the moment.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div
                key={faq.id}
                className="bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none group"
                >
                  <h3 className="text-lg md:text-xl font-semibold text-[#004e6c] dark:text-gray-200 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors pr-4">
                    {faq.question[language] || faq.question.mn}
                  </h3>
                  <svg
                    className={`w-6 h-6 text-[#004e6c] dark:text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-5">
                    <p className="text-[#004e6c]/70 dark:text-gray-400 leading-relaxed font-medium">
                      {faq.answer[language] || faq.answer.mn}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-8 bg-gradient-to-br from-[#004e6c] to-[#006b8f] rounded-xl p-6 md:p-8 text-white text-center shadow-xl">
          <h3 className="text-xl md:text-2xl font-bold mb-3">
            {language === 'mn' ? 'Асуулт үлдээх' : 'Still have questions?'}
          </h3>
          <p className="text-white/90 mb-4 font-medium text-sm">
            {language === 'mn' 
              ? 'Хэрэв таны асуултын хариулт энд байхгүй бол бидэнтэй холбогдоорой' 
              : 'If your question is not answered here, please contact us'}
          </p>
          <button
            onClick={() => window.location.href = '/contact'}
            className="bg-white text-[#004e6c] px-6 py-2 rounded-lg hover:bg-[#ff6b35] hover:text-white transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
          >
            {language === 'mn' ? 'Бидэнтэй холбогдох' : 'Contact Us'}
          </button>
        </div>
      </section>

      <Footer />
    </main>
  )
}

