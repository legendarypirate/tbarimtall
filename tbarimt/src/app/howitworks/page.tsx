'use client'

import { useRouter } from 'next/navigation'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useLanguage } from '@/contexts/LanguageContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

export default function HowItWorksPage() {
  const router = useRouter()
  const { isDark } = useDarkMode()
  const { language } = useLanguage()

  const content = {
    mn: {
      title: 'Хэрхэн ажиллах вэ',
      subtitle: 'TBARIMT платформ дээр контент худалдаж авах, зарах нь маш энгийн',
      forBuyers: 'Худалдан авагчдад',
      forSellers: 'Худалдагчдад',
      step1Title: 'Бүртгүүлэх',
      step1Desc: 'Манай платформ дээр бүртгүүлээд үнэгүй данс үүсгэнэ үү',
      step2Title: 'Хайх эсвэл Нийтлэх',
      step2DescBuyer: 'Хэрэгтэй контентээ хайж олоод худалдан авна уу',
      step2DescSeller: 'Өөрийн контентээ оруулаад үнэ тогтооно уу',
      step3Title: 'Худалдаа хийх',
      step3DescBuyer: 'Төлбөр төлөөд контентээ шууд татаж авна уу',
      step3DescSeller: 'Худалдаа болсны дараа орлогоо хүлээн авна уу',
      step4Title: 'Ашиглах эсвэл Орлого авах',
      step4DescBuyer: 'Татаж авсан контентээ ашиглана уу',
      step4DescSeller: 'Орлогоо данс руу авах эсвэл дахин хөрөнгө оруулалт хийх',
      benefitsTitle: 'Яагаад TBARIMT сонгох вэ?',
      benefit1Title: 'Аюулгүй төлбөр',
      benefit1Desc: 'Бүх төлбөр манай аюулгүй системээр дамжин хийгддэг',
      benefit2Title: 'Шууд хүргэлт',
      benefit2Desc: 'Худалдаа болсны дараа контентээ шууд татаж авах боломжтой',
      benefit3Title: 'Шударга үнэ',
      benefit3Desc: 'Бүх бүтээгдэхүүний үнэ ил тод, шударга байдаг',
      benefit4Title: 'Чанартай контент',
      benefit4Desc: 'Бүх контент манай баг шалгаж баталгаажуулдаг',
      ctaTitle: 'Эхлэхэд бэлэн үү?',
      ctaDesc: 'Одоо бүртгүүлээд контент худалдаж эхлээрэй',
      ctaButton: 'Бүртгүүлэх',
      browseButton: 'Бүтээгдэхүүн үзэх'
    },
    en: {
      title: 'How It Works',
      subtitle: 'Buying and selling content on TBARIMT platform is very simple',
      forBuyers: 'For Buyers',
      forSellers: 'For Sellers',
      step1Title: 'Sign Up',
      step1Desc: 'Register on our platform and create a free account',
      step2Title: 'Search or Publish',
      step2DescBuyer: 'Search and find the content you need and purchase it',
      step2DescSeller: 'Upload your content and set your price',
      step3Title: 'Make Transaction',
      step3DescBuyer: 'Make payment and download your content instantly',
      step3DescSeller: 'Receive your earnings after the transaction',
      step4Title: 'Use or Get Paid',
      step4DescBuyer: 'Use the downloaded content',
      step4DescSeller: 'Withdraw your earnings to your account or reinvest',
      benefitsTitle: 'Why Choose TBARIMT?',
      benefit1Title: 'Secure Payment',
      benefit1Desc: 'All payments are processed through our secure system',
      benefit2Title: 'Instant Delivery',
      benefit2Desc: 'Download your content immediately after purchase',
      benefit3Title: 'Fair Pricing',
      benefit3Desc: 'All product prices are transparent and fair',
      benefit4Title: 'Quality Content',
      benefit4Desc: 'All content is verified and quality-checked by our team',
      ctaTitle: 'Ready to Get Started?',
      ctaDesc: 'Sign up now and start buying and selling content',
      ctaButton: 'Sign Up',
      browseButton: 'Browse Products'
    }
  }

  const t = content[language]

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
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#004e6c] dark:text-gray-200 mb-6 leading-tight tracking-tight">
              {t.title}
            </h2>
            <p className="text-xl md:text-2xl text-[#004e6c]/70 dark:text-gray-400 mb-12 max-w-3xl mx-auto font-medium">
              {t.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* For Buyers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white dark:bg-gray-900">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-extrabold text-[#004e6c] dark:text-gray-200 mb-4">
            {t.forBuyers}
          </h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff6b35]/8 dark:bg-[#ff6b35]/15 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-[#ff6b35]/15 dark:group-hover:bg-[#ff6b35]/25 transition-all"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] dark:group-hover:from-[#ff8555] dark:group-hover:to-[#ff6b35] transition-all duration-300">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h4 className="text-xl font-bold text-[#004e6c] dark:text-gray-200 mb-4 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
                {t.step1Title}
              </h4>
              <p className="text-[#004e6c]/70 dark:text-gray-400 leading-relaxed font-medium">
                {t.step1Desc}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff6b35]/8 dark:bg-[#ff6b35]/15 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-[#ff6b35]/15 dark:group-hover:bg-[#ff6b35]/25 transition-all"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] dark:group-hover:from-[#ff8555] dark:group-hover:to-[#ff6b35] transition-all duration-300">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h4 className="text-xl font-bold text-[#004e6c] dark:text-gray-200 mb-4 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
                {t.step2Title}
              </h4>
              <p className="text-[#004e6c]/70 dark:text-gray-400 leading-relaxed font-medium">
                {t.step2DescBuyer}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff6b35]/8 dark:bg-[#ff6b35]/15 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-[#ff6b35]/15 dark:group-hover:bg-[#ff6b35]/25 transition-all"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] dark:group-hover:from-[#ff8555] dark:group-hover:to-[#ff6b35] transition-all duration-300">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h4 className="text-xl font-bold text-[#004e6c] dark:text-gray-200 mb-4 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
                {t.step3Title}
              </h4>
              <p className="text-[#004e6c]/70 dark:text-gray-400 leading-relaxed font-medium">
                {t.step3DescBuyer}
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff6b35]/8 dark:bg-[#ff6b35]/15 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-[#ff6b35]/15 dark:group-hover:bg-[#ff6b35]/25 transition-all"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] dark:group-hover:from-[#ff8555] dark:group-hover:to-[#ff6b35] transition-all duration-300">
                <span className="text-3xl font-bold text-white">4</span>
              </div>
              <h4 className="text-xl font-bold text-[#004e6c] dark:text-gray-200 mb-4 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
                {t.step4Title}
              </h4>
              <p className="text-[#004e6c]/70 dark:text-gray-400 leading-relaxed font-medium">
                {t.step4DescBuyer}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Sellers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-100 dark:bg-gray-800">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-extrabold text-[#004e6c] dark:text-gray-200 mb-4">
            {t.forSellers}
          </h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff6b35]/8 dark:bg-[#ff6b35]/15 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-[#ff6b35]/15 dark:group-hover:bg-[#ff6b35]/25 transition-all"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] dark:group-hover:from-[#ff8555] dark:group-hover:to-[#ff6b35] transition-all duration-300">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h4 className="text-xl font-bold text-[#004e6c] dark:text-gray-200 mb-4 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
                {t.step1Title}
              </h4>
              <p className="text-[#004e6c]/70 dark:text-gray-400 leading-relaxed font-medium">
                {t.step1Desc}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff6b35]/8 dark:bg-[#ff6b35]/15 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-[#ff6b35]/15 dark:group-hover:bg-[#ff6b35]/25 transition-all"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] dark:group-hover:from-[#ff8555] dark:group-hover:to-[#ff6b35] transition-all duration-300">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h4 className="text-xl font-bold text-[#004e6c] dark:text-gray-200 mb-4 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
                {t.step2Title}
              </h4>
              <p className="text-[#004e6c]/70 dark:text-gray-400 leading-relaxed font-medium">
                {t.step2DescSeller}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff6b35]/8 dark:bg-[#ff6b35]/15 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-[#ff6b35]/15 dark:group-hover:bg-[#ff6b35]/25 transition-all"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] dark:group-hover:from-[#ff8555] dark:group-hover:to-[#ff6b35] transition-all duration-300">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h4 className="text-xl font-bold text-[#004e6c] dark:text-gray-200 mb-4 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
                {t.step3Title}
              </h4>
              <p className="text-[#004e6c]/70 dark:text-gray-400 leading-relaxed font-medium">
                {t.step3DescSeller}
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff6b35]/8 dark:bg-[#ff6b35]/15 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-[#ff6b35]/15 dark:group-hover:bg-[#ff6b35]/25 transition-all"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] dark:group-hover:from-[#ff8555] dark:group-hover:to-[#ff6b35] transition-all duration-300">
                <span className="text-3xl font-bold text-white">4</span>
              </div>
              <h4 className="text-xl font-bold text-[#004e6c] dark:text-gray-200 mb-4 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
                {t.step4Title}
              </h4>
              <p className="text-[#004e6c]/70 dark:text-gray-400 leading-relaxed font-medium">
                {t.step4DescSeller}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white dark:bg-gray-900">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-extrabold text-[#004e6c] dark:text-gray-200 mb-4">
            {t.benefitsTitle}
          </h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Benefit 1 */}
          <div className="text-center bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 group">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-2xl mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] dark:group-hover:from-[#ff8555] dark:group-hover:to-[#ff6b35] transition-all duration-300">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-[#004e6c] dark:text-gray-200 mb-3 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
              {t.benefit1Title}
            </h4>
            <p className="text-[#004e6c]/70 dark:text-gray-400 font-medium">
              {t.benefit1Desc}
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="text-center bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 group">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-2xl mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] dark:group-hover:from-[#ff8555] dark:group-hover:to-[#ff6b35] transition-all duration-300">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-[#004e6c] dark:text-gray-200 mb-3 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
              {t.benefit2Title}
            </h4>
            <p className="text-[#004e6c]/70 dark:text-gray-400 font-medium">
              {t.benefit2Desc}
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="text-center bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 group">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-2xl mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] dark:group-hover:from-[#ff8555] dark:group-hover:to-[#ff6b35] transition-all duration-300">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-[#004e6c] dark:text-gray-200 mb-3 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
              {t.benefit3Title}
            </h4>
            <p className="text-[#004e6c]/70 dark:text-gray-400 font-medium">
              {t.benefit3Desc}
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="text-center bg-white dark:bg-gray-800 border-2 border-[#004e6c]/20 dark:border-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:border-[#ff6b35]/30 dark:hover:border-[#ff8555]/30 group">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c] rounded-2xl mb-6 shadow-lg group-hover:from-[#ff6b35] group-hover:to-[#ff8555] dark:group-hover:from-[#ff8555] dark:group-hover:to-[#ff6b35] transition-all duration-300">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-[#004e6c] dark:text-gray-200 mb-3 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff8555] transition-colors">
              {t.benefit4Title}
            </h4>
            <p className="text-[#004e6c]/70 dark:text-gray-400 font-medium">
              {t.benefit4Desc}
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative w-full py-24 overflow-hidden bg-gradient-to-br from-[#004e6c] to-[#006b8f] dark:from-[#006b8f] dark:to-[#004e6c]">
        {/* Abstract background graphics */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#ff6b35]/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white dark:text-gray-200 mb-6">
            {t.ctaTitle}
          </h2>
          <p className="text-xl md:text-2xl text-white/90 dark:text-gray-300 mb-10 max-w-2xl mx-auto font-medium">
            {t.ctaDesc}
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <button 
              onClick={() => router.push('/login')}
              className="bg-[#ff6b35] dark:bg-[#ff8555] text-white px-12 py-5 rounded-2xl text-lg font-bold hover:bg-[#ff8555] dark:hover:bg-[#ff6b35] transition-all shadow-2xl hover:shadow-[#ff6b35]/50 transform hover:-translate-y-1"
            >
              {t.ctaButton}
            </button>
            <button 
              onClick={() => router.push('/products')}
              className="bg-white dark:bg-gray-800 text-[#004e6c] dark:text-gray-200 border-2 border-white dark:border-gray-600 px-12 py-5 rounded-2xl text-lg font-bold hover:bg-[#ff6b35] dark:hover:bg-[#ff8555] hover:text-white hover:border-[#ff6b35] dark:hover:border-[#ff8555] transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              {t.browseButton}
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

