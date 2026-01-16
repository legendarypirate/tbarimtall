'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { getTranslation, formatTranslation } from '@/lib/translations'
import TermsAndConditionsModal from './TermsAndConditionsModal'
import PrivacyPolicyModal from './PrivacyPolicyModal'

export default function Footer() {
  const router = useRouter()
  const { language, setLanguage } = useLanguage()
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  return (
    <footer className="bg-[#004e6c] dark:bg-gray-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Logo */}
          <div className="flex flex-col">
            <div className="flex items-center mb-4">
              <div className="h-14 rounded-xl flex items-center justify-center overflow-hidden">
                <img src="/lg.png" alt="TBARIMT Logo" className="h-full w-auto object-contain" />
              </div>
            </div>
            <p className="text-white/70 dark:text-gray-300 text-sm mb-4">
              {getTranslation(language, 'footerDescription')}
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

          {/* Column 2: Menu Items */}
          <div className="flex flex-col">
            <h6 className="text-white dark:text-gray-200 font-semibold mb-4">{getTranslation(language, 'legal')}</h6>
            <ul className="space-y-3">
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
              <li>
                <button 
                  onClick={() => router.push('/howitworks')}
                  className="text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm"
                >
                  {getTranslation(language, 'howItWorksFooter')}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Menu Items */}
          <div className="flex flex-col">
            <h6 className="text-white dark:text-gray-200 font-semibold mb-4">{getTranslation(language, 'resources')}</h6>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => router.push('/membership')}
                  className="text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm"
                >
                  {getTranslation(language, 'pricing')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => router.push('/faq')}
                  className="text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors text-sm"
                >
                  {getTranslation(language, 'help')}
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
            </ul>
          </div>

          {/* Column 4: Contact Info & Language */}
          <div className="flex flex-col">
            <h6 className="text-white dark:text-gray-200 font-semibold mb-4">{getTranslation(language, 'contact')}</h6>
            <ul className="space-y-3 mb-6">
              <li className="text-white/70 dark:text-gray-400 text-sm">
                {getTranslation(language, 'email')}: info@tbarimt.com
              </li>
              <li className="text-white/70 dark:text-gray-400 text-sm">
                {getTranslation(language, 'phone')}: +976 93000022
              </li>
              <li className="text-white/70 dark:text-gray-400 text-sm">
                {getTranslation(language, 'address')}: Улаанбаатар хот, Хан-Уул дүүрэг 2-р хороо 19 Үйлчилгээний төвөөс баруун тийш 15-р сургуулийн дэргэд
              </li>
            </ul>
            
            {/* Language Selection */}
           
          </div>
        </div>

        {/* Bottom Border */}
        <div className="mt-12 pt-8 border-t border-white/20 dark:border-gray-700">
          <p className="text-white/60 dark:text-gray-500 text-sm text-center">
            {formatTranslation(language, 'allRightsReserved', { year: String(new Date().getFullYear()) })}
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

