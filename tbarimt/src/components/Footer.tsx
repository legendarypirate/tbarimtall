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
            <p className="text-white/70 dark:text-gray-300 text-sm">
              {getTranslation(language, 'footerDescription')}
            </p>
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

