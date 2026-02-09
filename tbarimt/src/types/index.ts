// Core Entity Types
export interface Product {
  id: number | string;
  uuid?: string;
  title: string;
  description?: string;
  price: number;
  category?: Category | string;
  categoryId?: number;
  subcategoryId?: number;
  pages?: number;
  size?: string;
  downloads?: number;
  rating?: number;
  image?: string;
  images?: string[];
  previewImages?: string[];
  fileType?: string;
  isActive?: boolean;
  isUnique?: boolean;
  status?: 'new' | 'cancelled' | 'deleted';
  createdAt?: string;
  updatedAt?: string;
  journalist?: Journalist;
  journalistId?: number;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  description?: string;
  subcategories?: Subcategory[];
  parentId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subcategory {
  id: number;
  name: string;
  categoryId: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Journalist {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  avatar?: string;
  bio?: string;
  followersCount?: number;
  productsCount?: number;
  rating?: number;
  isFollowing?: boolean;
  createdAt?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'journalist' | 'admin';
  income?: number;
  balance?: number;
  createdAt?: string;
}

export interface Order {
  id: number;
  productId: number;
  userId: number;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  paymentMethod?: 'qpay' | 'bank' | 'wallet';
  invoiceId?: string;
  createdAt?: string;
  product?: Product;
}

export interface WishlistItem {
  id: number;
  productId: number;
  userId: number;
  createdAt?: string;
  product?: Product;
}

export interface Membership {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration: number; // in days
  maxFileSize?: number; // in MB
  features?: string[];
  isActive?: boolean;
  createdAt?: string;
}

export interface Banner {
  id: number;
  title?: string;
  image: string;
  link?: string;
  order?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface HeroSlider {
  id: number;
  title?: string;
  description?: string;
  image: string;
  link?: string;
  order?: number;
  isActive?: boolean;
  createdAt?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductsResponse {
  products: Product[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface CategoriesResponse {
  categories: Category[];
}

// Request Types
export interface GetProductsParams {
  page?: number;
  limit?: number;
  categoryId?: number;
  subcategoryId?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: string;
}

export interface CreateProductData {
  title: string;
  description: string;
  categoryId: number;
  subcategoryId?: number;
  price: number;
  pages?: number;
  size?: string;
  status?: 'new' | 'cancelled' | 'deleted';
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: number | string;
}

export interface CreateSimilarFileRequestData {
  productId: number | string;
  description?: string;
}

export interface CreateCopyrightReportData {
  productId: number | string;
  comment: string;
  phone?: string;
}

export interface CreateQPayInvoiceData {
  productId: string;
  amount: number;
  description?: string;
}

export interface PaymentStatus {
  status: 'pending' | 'paid' | 'failed';
  invoiceId?: string;
}

// UI Types
export type ViewMode = 'grid' | 'list';
export type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'rating' | 'downloads';
export type PaymentMethod = 'qpay' | 'bank' | 'wallet';

export interface FilterState {
  searchQuery: string;
  selectedCategory: string;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  sortBy: SortOption;
  viewMode: ViewMode;
}

// Error Types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Weather Types
export interface WeatherData {
  temp: number;
  description: string;
  icon: string;
}

// Currency Types
export interface CurrencyData {
  usd: number;
  eur: number;
}

