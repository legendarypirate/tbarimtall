export type Language = 'mn' | 'en'

export const translations = {
  mn: {
    // Header
    search: 'Хайх...',
    uploadContent: 'Нийтлэл оруулах',
    categories: 'Ангилал',
    howItWorks: 'Хэрхэн ажиллах вэ',
    pricing: 'Үнэ',
    faq: 'Түгээмэл асуулт хариулт',
    wishlist: 'Хүслийн жагсаалт',
    
    // Home page
    heroTitle: 'Контент авах, зарах',
    heroSubtitle: 'аюулгүй',
    viewAllContent: 'Бүх контент үзэх',
    addYourContent: 'Өөрийн контент оруулах',
    users: 'Users',
    creators: 'Creators',
    contents: 'Contents',
    earned: 'Earned',
    allCategories: 'Ангилалууд',
    all: 'Бүгд',
    featuredProducts: 'Онцлох бүтээгдэхүүн',
    showAll: 'Бүгдийг харуулах',
    viewAllContentButton: 'Бүх контент харах',
    pages: 'хуудас',
    loading: 'Ачааллаж байна...',
    details: 'Дэлгэрэнгүй',
    
    // Features
    secureAndVerified: 'Аюулгүй ба Баталгаажсан',
    earnMoreRevenue: 'Илүү Орлого Олох',
    bromesCenter: 'Бромес Төв',
    diverseContentMarketplace: 'Олон Төрлийн Контентын Зах Зээл',
    
    // CTA
    whyTitle: 'Яагаад гэж',
    whyDescription: 'Контентоо оруулаад мөнгө олж эхэл!',
    joinForFree: 'Join for Free',
    
    // Membership
    membershipPlans: 'Гишүүнчлэлийн төлөвлөгөө',
    chooseMembershipPlan: 'Өөрийн хэрэгцээнд тохирох гишүүнчлэлийн төлөвлөгөөг сонгоно уу',
    selectPlan: 'Төлөвлөгөө сонгох',
    maxPosts: 'Хамгийн ихдээ нийтлэл',
    popular: 'АЛДАРТАЙ',
    
    // Footer
    footerDescription: 'Your trusted platform for digital content and services.',
    legal: 'Legal',
    terms: 'Terms',
    privacyPolicy: 'Privacy Policy',
    howItWorksFooter: 'How It Works',
    resources: 'Resources',
    help: 'Help',
    mby: 'Mby',
    searchFooter: 'Search',
    contact: 'Contact',
    allRightsReserved: '© {year} All rights reserved.',
  },
  en: {
    // Header
    search: 'Search...',
    uploadContent: 'Upload Content',
    categories: 'Categories',
    howItWorks: 'How It Works',
    pricing: 'Pricing',
    faq: 'FAQ',
    wishlist: 'Wishlist',
    
    // Home page
    heroTitle: 'Buy and sell content',
    heroSubtitle: 'securely',
    viewAllContent: 'View All Content',
    addYourContent: 'Add Your Content',
    users: 'Users',
    creators: 'Creators',
    contents: 'Contents',
    earned: 'Earned',
    allCategories: 'Categories',
    all: 'All',
    featuredProducts: 'Featured Products',
    showAll: 'Show All',
    viewAllContentButton: 'View All Content',
    pages: 'pages',
    loading: 'Loading...',
    details: 'Details',
    
    // Features
    secureAndVerified: 'Secure & Verified',
    earnMoreRevenue: 'Earn More Revenue',
    bromesCenter: 'Bromes Center',
    diverseContentMarketplace: 'Diverse Content Marketplace',
    
    // CTA
    whyTitle: 'Why',
    whyDescription: 'Upload your content and start earning!',
    joinForFree: 'Join for Free',
    
    // Membership
    membershipPlans: 'Membership Plans',
    chooseMembershipPlan: 'Choose the perfect membership plan for your needs',
    selectPlan: 'Select Plan',
    maxPosts: 'Max Posts',
    popular: 'POPULAR',
    
    // Footer
    footerDescription: 'Your trusted platform for digital content and services.',
    legal: 'Legal',
    terms: 'Terms',
    privacyPolicy: 'Privacy Policy',
    howItWorksFooter: 'How It Works',
    resources: 'Resources',
    help: 'Help',
    mby: 'Mby',
    searchFooter: 'Search',
    contact: 'Contact',
    allRightsReserved: '© {year} All rights reserved.',
  },
}

export function getTranslation(lang: Language, key: keyof typeof translations.mn): string {
  return translations[lang][key] || translations.mn[key]
}

export function formatTranslation(lang: Language, key: keyof typeof translations.mn, params?: Record<string, string | number>): string {
  let text = getTranslation(lang, key)
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(`{${paramKey}}`, String(value))
    })
  }
  return text
}

