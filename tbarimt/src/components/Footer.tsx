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
    <footer className="bg-darkBlue-500 dark:bg-gray-950 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Column 1: Logo & Description */}
          <div className="flex flex-col lg:col-span-1">
            <div className="flex items-center mb-4">
              <div className="h-14 rounded-xl flex items-center justify-center overflow-hidden">
                <img src="/lg.png" alt="TBARIMT Logo" className="h-full w-auto object-contain" />
              </div>
              <span className="ml-2 text-teal-400 text-xl">✓</span>
            </div>
            <p className="text-white/80 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              Дижитал контент бүтээгч болон хэрэглэгчдийг холбосон Монголын хамгийн том зах зээл.
            </p>
            
            {/* Newsletter Signup */}
            <div className="mb-4">
              <h6 className="text-white font-semibold mb-3 text-xs uppercase">МЭДЭЭЛЭЛ ХҮЛЭЭН АВАХ</h6>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Таны и-мэйл"
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
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

          {/* Column 2: Platform Links */}
          <div className="flex flex-col">
            <h6 className="text-white dark:text-white font-semibold mb-4 text-base uppercase">ПЛАТФОРМ</h6>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => router.push('/about')}
                  className="text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm text-left"
                >
                  Бидний тухай
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setShowTermsModal(true)}
                  className="text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm text-left"
                >
                  Үйлчилгээний нөхцөл
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm text-left"
                >
                  Нууцлалын бодлого
                </button>
              </li>
              <li>
                <button 
                  onClick={() => router.push('/faq')}
                  className="text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm text-left"
                >
                  Тусламж
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Categories */}
          <div className="flex flex-col">
            <h6 className="text-white dark:text-white font-semibold mb-4 text-base uppercase">АНГИЛАЛ</h6>
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


          {/* Column 4: Social & Contact */}
          <div className="flex flex-col">
            <h6 className="text-white dark:text-white font-semibold mb-4 text-base uppercase">SOCIAL</h6>
            <div className="flex space-x-3 mb-6">
              <a
                href="https://www.facebook.com/TBarimt"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all"
                aria-label="Facebook"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all"
                aria-label="Instagram"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all"
                aria-label="LinkedIn"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
            <div className="space-y-2">
              <a 
                href="mailto:info@tbarimt.mn"
                className="text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm block"
              >
                INFO@TBARIMT.MN
              </a>
              <a 
                href="tel:+97677000000"
                className="text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm block"
              >
                +976 7700 0000
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Border */}
        <div className="mt-12 pt-8 border-t border-white/20 dark:border-gray-800">
          <p className="text-white/70 dark:text-gray-500 text-sm text-center">
            © 2024 TBARIMT ENTERPRISE. БҮХ ЭРХ ХУУЛИАР ХАМГААЛАГДСАН.
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

