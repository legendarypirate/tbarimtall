import { Product, Category } from '@/types';

/**
 * Format number with Mongolian locale
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('mn-MN');
};

/**
 * Format currency with Mongolian locale
 */
export const formatCurrency = (amount: number): string => {
  return `${formatNumber(amount)}₮`;
};

/**
 * Get absolute URL from relative or absolute URL
 */
export const getAbsoluteUrl = (url: string, baseUrl: string = 'https://tbarimt.mn'): string => {
  if (!url) return `${baseUrl}/tbarimt.jpeg`;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Handle Cloudinary URLs
  if (url.includes('cloudinary.com') || url.includes('res.cloudinary.com')) {
    return url.startsWith('//') ? `https:${url}` : url;
  }
  // Handle API URLs
  if (url.includes('/api/') || url.includes('/uploads/')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.tbarimt.mn';
    return url.startsWith('/') ? `${apiUrl}${url}` : `${apiUrl}/${url}`;
  }
  const origin = baseUrl || 'https://tbarimt.mn';
  return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
};

/**
 * Get category name from product
 */
export const getCategoryName = (product: Product): string => {
  if (typeof product.category === 'object' && product.category?.name) {
    return product.category.name;
  }
  if (typeof product.category === 'string') {
    return product.category;
  }
  return 'N/A';
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Remove HTML tags from text
 */
export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').trim();
};

/**
 * Get time remaining until expiry
 */
export const getTimeRemaining = (expiresAt: string): string => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  
  if (diff <= 0) return 'Хугацаа дууссан';
  
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  return `${minutes} минут ${seconds} секунд`;
};

/**
 * Check if device is mobile
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  const isSmallScreen = window.innerWidth <= 768;
  return isMobile || isSmallScreen;
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Get file extension from MIME type
 */
export const getFileExtension = (mimeType: string): string => {
  const mimeToExtension: Record<string, string> = {
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/pdf': 'pdf',
    'application/zip': 'zip',
    'application/x-rar-compressed': 'rar',
    'application/x-7z-compressed': '7z',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'application/x-msdownload': 'exe',
    'application/x-executable': 'exe',
  };
  
  const lowerMimeType = mimeType.toLowerCase();
  if (mimeToExtension[lowerMimeType]) {
    return mimeToExtension[lowerMimeType].toUpperCase();
  }
  
  if (mimeType.includes('/')) {
    const parts = mimeType.split('/');
    if (parts.length === 2) {
      const subtype = parts[1]
        .replace(/^vnd\./, '')
        .replace(/^x-/, '')
        .replace(/^officedocument\./, '')
        .replace(/^openxmlformats-officedocument\./, '')
        .replace(/spreadsheetml\.sheet/, 'xlsx')
        .replace(/wordprocessingml\.document/, 'docx')
        .replace(/presentationml\.presentation/, 'pptx');
      
      if (/^[a-z0-9]+$/i.test(subtype) && subtype.length <= 5) {
        return subtype.toUpperCase();
      }
    }
  }
  
  return mimeType;
};

/**
 * Generate placeholder images
 */
export const generatePlaceholderImages = (count: number = 3, seed?: string): string[] => {
  const images: string[] = [];
  const imageSeed = seed || Math.random().toString(36).substring(7);
  
  for (let i = 0; i < count; i++) {
    images.push(`https://picsum.photos/seed/${imageSeed}-${i}/800/500`);
  }
  
  return images;
};

/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Mongolian format)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+976|976)?[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Get weather info from WMO code
 */
export const getWeatherInfo = (code: number, isDay: number): { description: string; icon: string } => {
  const isDayTime = isDay === 1;
  const weatherMap: Record<number, { description: string; icon: string }> = {
    0: { description: 'Тод тэнгэр', icon: isDayTime ? '☀️' : '🌙' },
    1: { description: 'Голчлон тод', icon: isDayTime ? '🌤️' : '☁️' },
    2: { description: 'Хэсэгчлэн үүлтэй', icon: isDayTime ? '⛅' : '☁️' },
    3: { description: 'Үүлтэй', icon: '☁️' },
    45: { description: 'Манан', icon: '🌫️' },
    48: { description: 'Хөлдсөн манан', icon: '🌫️' },
    51: { description: 'Бага зэргийн бороо', icon: '🌦️' },
    53: { description: 'Дунд зэргийн бороо', icon: '🌦️' },
    55: { description: 'Хүчтэй бороо', icon: '🌧️' },
    56: { description: 'Хөлдсөн бага бороо', icon: '🌨️' },
    57: { description: 'Хөлдсөн хүчтэй бороо', icon: '🌨️' },
    61: { description: 'Бага бороо', icon: '🌦️' },
    63: { description: 'Дунд бороо', icon: '🌧️' },
    65: { description: 'Хүчтэй бороо', icon: '🌧️' },
    66: { description: 'Хөлдсөн бага бороо', icon: '🌨️' },
    67: { description: 'Хөлдсөн хүчтэй бороо', icon: '🌨️' },
    71: { description: 'Бага цас', icon: '🌨️' },
    73: { description: 'Дунд цас', icon: '❄️' },
    75: { description: 'Хүчтэй цас', icon: '❄️' },
    77: { description: 'Цасны ширхэг', icon: '❄️' },
    80: { description: 'Бага борооны шүүрэл', icon: '🌦️' },
    81: { description: 'Дунд борооны шүүрэл', icon: '🌧️' },
    82: { description: 'Хүчтэй борооны шүүрэл', icon: '⛈️' },
    85: { description: 'Бага цасны шүүрэл', icon: '🌨️' },
    86: { description: 'Хүчтэй цасны шүүрэл', icon: '❄️' },
    95: { description: 'Аянгатай бороо', icon: '⛈️' },
    96: { description: 'Аянгатай мөндөртэй бороо', icon: '⛈️' },
    99: { description: 'Хүчтэй аянгатай мөндөр', icon: '⛈️' },
  };
  
  return weatherMap[code] || { description: 'Тодорхойгүй', icon: '🌤️' };
};

/**
 * Class name utility (like clsx)
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

