// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tbarimt.mn';

// Default Values
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_FEATURED_LIMIT = 8;
export const DEFAULT_RECOMMENDED_LIMIT = 8;
export const DEFAULT_BEST_SELLING_LIMIT = 5;

// Sort Options
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Шинэ эхэнд' },
  { value: 'oldest', label: 'Хуучин эхэнд' },
  { value: 'price-low', label: 'Үнэ: Багаас их рүү' },
  { value: 'price-high', label: 'Үнэ: Ихээс бага руу' },
  { value: 'rating', label: 'Үнэлгээ: Өндөр' },
  { value: 'downloads', label: 'Эрэлт: Өндөр' },
] as const;

// Price Ranges
export const DEFAULT_MIN_PRICE = 0;
export const DEFAULT_MAX_PRICE = 100000;

// Rating Ranges
export const MIN_RATING = 0;
export const MAX_RATING = 5;

// Weather Configuration
export const ULAANBAATAR_COORDS = {
  lat: 47.92,
  lon: 106.92,
};

// Weather Code Mapping
export const WEATHER_CODE_MAP: Record<number, { description: string; icon: string }> = {
  0: { description: 'Тод тэнгэр', icon: '☀️' },
  1: { description: 'Голчлон тод', icon: '🌤️' },
  2: { description: 'Хэсэгчлэн үүлтэй', icon: '⛅' },
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

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  DARK_MODE: 'darkMode',
  LANGUAGE: 'language',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id: string | number) => `/products/${id}`,
  CATEGORY: (id: string | number) => `/category/${id}`,
  SUBCATEGORY: (id: string | number) => `/subcategory/${id}`,
  JOURNALIST: (id: string | number) => `/journalist/${id}`,
  SEARCH: '/search',
  LOGIN: '/login',
  WISHLIST: '/wishlist',
  PUBLISH: '/publish',
  ACCOUNT: '/account',
  MEMBERSHIP: '/membership',
  FAQ: '/faq',
  CONTACT: '/contact',
  ABOUT: '/about',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Сервертэй холбогдох боломжгүй байна. Сервер ажиллаж байгаа эсэхийг шалгана уу.',
  UNAUTHORIZED: 'Та нэвтэрч ороогүй байна.',
  FORBIDDEN: 'Та энэ үйлдлийг хийх эрхгүй байна.',
  NOT_FOUND: 'Олдсонгүй.',
  SERVER_ERROR: 'Серверийн алдаа гарлаа.',
  UNKNOWN_ERROR: 'Тодорхойгүй алдаа гарлаа.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PRODUCT_ADDED_TO_WISHLIST: 'Хүслийн жагсаалтад нэмэгдлээ',
  PRODUCT_REMOVED_FROM_WISHLIST: 'Хүслийн жагсаалтаас хаслаа',
  ORDER_CREATED: 'Захиалга амжилттай үүслээ',
  PAYMENT_SUCCESS: 'Төлбөр амжилттай',
} as const;

