'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { getTranslation, formatTranslation } from '@/lib/translations'
import { getCategories } from '@/lib/api'
import TermsAndConditionsModal from './TermsAndConditionsModal'
import PrivacyPolicyModal from './PrivacyPolicyModal'

export default function Footer() {
  const router = useRouter()
  const { language, setLanguage } = useLanguage()
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  // Fetch categories for footer links
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const response = await getCategories()
        if (response.categories && Array.isArray(response.categories)) {
          // Filter out generic categories and get only active ones
          const filteredCategories = response.categories
            .filter((cat: any) => {
              const isGenericCategory = /^Category\s+\d+$/i.test(cat.name)
              return !isGenericCategory && cat.isActive
            })
            .slice(0, 8) // Limit to 8 categories for footer
          setCategories(filteredCategories)
        }
      } catch (error) {
        console.error('Error fetching categories for footer:', error)
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Column 1: Logo & Description */}
          <div className="flex flex-col lg:col-span-1">
            <div className="flex items-center mb-4">
              <div className="h-14 rounded-xl flex items-center justify-center overflow-hidden">
                <img src="/lg.png" alt="TBARIMT Logo" className="h-full w-auto object-contain" />
              </div>
            </div>
            <p className="text-gray-400 dark:text-gray-400 text-sm mb-4 leading-relaxed">
              {getTranslation(language, 'footerDescription') || 'Контент Дэлгүүр - Бүх төрлийн контент нэг дороос'}
            </p>
            <a
              href="https://www.facebook.com/TBarimt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full transition-all hover:scale-110"
              aria-label="Facebook хуудас"
              title="Facebook хуудас"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
          </div>

          {/* Column 2: Categories */}
          <div className="flex flex-col">
            <h6 className="text-white dark:text-white font-semibold mb-4 text-base">Ангилал</h6>
            {loadingCategories ? (
              <div className="text-white/50 text-sm">Ачааллаж байна...</div>
            ) : categories.length > 0 ? (
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li key={category.id}>
                    <button 
                      onClick={() => router.push(`/category/${category.id}`)}
                      className="text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm text-left"
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
                <li>
                  <button 
                    onClick={() => router.push('/products')}
                    className="text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm font-medium"
                  >
                    Бүх ангилал →
                  </button>
                </li>
              </ul>
            ) : (
              <p className="text-white/50 text-sm">Ангилал байхгүй</p>
            )}
          </div>

          {/* Column 3: Subscription & Membership */}
          <div className="flex flex-col">
            <h6 className="text-white dark:text-white font-semibold mb-4 text-base">Холбоос</h6>
            <div className="space-y-3">
              <p className="text-white/70 dark:text-gray-300 text-sm leading-relaxed mb-3">
                Зохиогчид бүртгэлд бүртгүүлж, бүтээлээ худалдаж авах боломжтой. Бүртгэл нь үнэгүй бөгөөд танд дараах давуу талуудыг санал болгоно:
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start space-x-2 text-white/70 dark:text-gray-300 text-sm">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Бүтээлээ худалдаж авах</span>
                </li>
                <li className="flex items-start space-x-2 text-white/70 dark:text-gray-300 text-sm">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Орлого авах</span>
                </li>
                <li className="flex items-start space-x-2 text-white/70 dark:text-gray-300 text-sm">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Бүртгэлийн түвшинг сайжруулах</span>
                </li>
              </ul>
              <button 
                onClick={() => router.push('/membership')}
                className="text-white/90 dark:text-gray-200 hover:text-white dark:hover:text-white transition-colors text-sm font-medium underline"
              >
                Дэлгэрэнгүй мэдээлэл →
              </button>
            </div>
          </div>

          {/* Column 4: Resources & FAQ */}
          <div className="flex flex-col">
            <h6 className="text-white dark:text-white font-semibold mb-4 text-base">Тусламж</h6>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => router.push('/faq')}
                  className="text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Түгээмэл асуулт (FAQ)</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => router.push('/howitworks')}
                  className="text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm"
                >
                  {getTranslation(language, 'howItWorksFooter')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => router.push('/search')}
                  className="text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm"
                >
                  {getTranslation(language, 'searchFooter')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setShowTermsModal(true)}
                  className="text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm"
                >
                  {getTranslation(language, 'terms')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm"
                >
                  {getTranslation(language, 'privacyPolicy')}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5: Contact Info */}
          <div className="flex flex-col">
            <h6 className="text-white dark:text-white font-semibold mb-4 text-base">{getTranslation(language, 'contact') || 'Холбоо барих'}</h6>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-white/70 dark:text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a 
                  href="mailto:info@tbarimt.com"
                  className="text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm"
                >
                  info@tbarimt.com
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-white/70 dark:text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a 
                  href="tel:+97693000022"
                  className="text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm"
                >
                  +976 93000022
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-white/70 dark:text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-white/70 dark:text-gray-400 text-sm">
                  Улаанбаатар хот, Хан-Уул дүүрэг<br />
                  2-р хороо 19 Үйлчилгээний төвөөс<br />
                  баруун тийш 15-р сургуулийн дэргэд
                </span>
              </li>
              <li className="pt-2">
                <button 
                  onClick={() => router.push('/contact')}
                  className="text-white/90 dark:text-gray-200 hover:text-white dark:hover:text-white transition-colors text-sm font-medium underline"
                >
                  Холбоо барих хуудас →
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Border */}
        <div className="mt-12 pt-8 border-t border-gray-800 dark:border-gray-800">
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center">
            {formatTranslation(language, 'allRightsReserved', { year: String(new Date().getFullYear()) }) || `© ${new Date().getFullYear()} TBARIMT. Бүх эрх хуулиар хамгаалагдсан.`}
          </p>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </footer>
  )
}

