export type Language = 'mn' | 'en'

export const translations = {
  mn: {
    // Header
    search: 'Хайх...',
    uploadContent: 'Нийтлэл оруулах',
    categories: 'Ангилал',
    howItWorks: 'Хэрхэн ажиллах вэ',
    pricing: 'Үнэ',
    faq: 'Бүх контент',
    wishlist: 'Хүслийн жагсаалт',
    
    // Home page
    heroTitle: 'Контент авах, зарах',
    heroSubtitle: 'аюулгүй',
    viewAllContent: 'Бүх контент үзэх',
    addYourContent: 'Өөрийн контент оруулах',
    users: 'Хэрэглэгч',
    creators: 'Нийтлэлч',
    contents: 'Контент',
    earned: 'Борлуулалт',
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
    joinForFree: 'үнэгүй нэгдэх',
    
    // Membership
    membershipPlans: 'Гишүүнчлэлийн эрх',
    chooseMembershipPlan: 'Өөрийн хэрэгцээнд тохирох гишүүнчлэлийн эрхийг сонгоно уу',
    selectPlan: 'Сонгох',
    maxPosts: 'Хамгийн ихдээ нийтлэл',
    popular: 'АЛДАРТАЙ',
    
    // Journalists Section
    topJournalists: 'Шилдэг нийтлэлчид',
    topJournalistsDescription: 'Манай платформын шилдэг контент бүтээгчид',
    viewProfile: 'Профайл харах',
    followers: 'дагагчид',
    posts: 'нийтлэл',
    rating: 'Үнэлгээ',
    
    // Footer
    footerDescription: 'Дижитал контент болон үйлчилгээний найдвартай платформ.',
    legal: 'Хуулийн',
    terms: 'Нөхцөл',
    privacyPolicy: 'Нууцлалын бодлого',
    howItWorksFooter: 'Хэрхэн ажиллах вэ',
    resources: 'Нөөц',
    help: 'Тусламж',
    mby: 'Mby',
    searchFooter: 'Хайх',
    contact: 'Холбоо барих',
    language: 'Хэл',
    mongolian: 'Монгол',
    english: 'Англи',
    email: 'Имэйл',
    phone: 'Утас',
    address: 'Хаяг',
    allRightsReserved: '© {year} Бүх эрх хуулиар хамгаалагдсан.',
  },
  en: {
    // Header
    search: 'Search...',
    uploadContent: 'Upload Content',
    categories: 'Categories',
    howItWorks: 'How It Works',
    pricing: 'Pricing',
    faq: 'All Content',
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
    
    // Journalists Section
    topJournalists: 'Top Journalists',
    topJournalistsDescription: 'Top content creators on our platform',
    viewProfile: 'View Profile',
    followers: 'followers',
    posts: 'posts',
    rating: 'Rating',
    
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
    language: 'Language',
    mongolian: 'Mongolian',
    english: 'English',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
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

