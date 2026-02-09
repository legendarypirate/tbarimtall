/**
 * Centralized API exports
 * This maintains backward compatibility while using the new structure
 */

// Re-export all API modules
export * from './client';
export * from './products';

// Re-export specific APIs for convenience
export { productsApi } from './products';

// Legacy exports for backward compatibility
import { apiClient } from './client';
import type {
  Product,
  Category,
  Journalist,
  User,
  Order,
  WishlistItem,
  Membership,
  Banner,
  HeroSlider,
  GetProductsParams,
  CreateProductData,
  CreateSimilarFileRequestData,
  CreateCopyrightReportData,
  CreateQPayInvoiceData,
  ProductsResponse,
  CategoriesResponse,
} from '@/types';

// Products (legacy)
export async function getProducts(params?: GetProductsParams) {
  return apiClient.get<ProductsResponse>('/products', params);
}

export async function getProductById(id: string | number) {
  return apiClient.get<{ product: Product }>(`/products/${id}`);
}

export async function getFeaturedProducts(limit: number = 8) {
  return apiClient.get<ProductsResponse>(`/products/featured`, { limit });
}

export async function getRecentProducts(limit: number = 8) {
  return apiClient.get<ProductsResponse>(`/products/recent`, { limit });
}

export async function getRecommendedProducts(productId: string | number, limit: number = 8) {
  return apiClient.get<ProductsResponse>(`/products/recommended`, { productId, limit });
}

export async function getBestSellingProducts(limit: number = 5) {
  return apiClient.get<ProductsResponse>('/products', { limit, sortBy: 'downloads' });
}

export async function createProduct(productData: CreateProductData) {
  return apiClient.post<{ product: Product }>('/products', productData);
}

export async function updateProduct(productId: string | number, productData: any) {
  return apiClient.put<{ product: Product }>(`/products/${productId}`, productData);
}

export async function createProductWithFiles(formData: FormData) {
  return apiClient.upload<{ product: Product }>('/products', formData);
}

export async function getMyProducts(params?: { page?: number; limit?: number; status?: string }) {
  return apiClient.get<ProductsResponse>('/products/my-products', params);
}

export async function getMyStatistics() {
  return apiClient.get('/products/my-statistics');
}

// Categories
export async function getCategories() {
  return apiClient.get<CategoriesResponse>('/categories');
}

export async function getCategoryById(id: string | number) {
  return apiClient.get<{ category: Category }>(`/categories/${id}`);
}

export async function getCategoryProducts(id: string | number, page: number = 1, limit: number = 20) {
  return apiClient.get<ProductsResponse>(`/categories/${id}/products`, { page, limit });
}

// Subcategories
export async function getSubcategoryById(id: string | number) {
  return apiClient.get(`/categories/subcategory/${id}`);
}

export async function getSubcategoryProducts(id: string | number, page: number = 1, limit: number = 20) {
  return apiClient.get<ProductsResponse>(`/categories/subcategory/${id}/products`, { page, limit });
}

// Journalists
export async function getTopJournalists(limit: number = 10) {
  return apiClient.get<{ journalists: Journalist[] }>(`/journalists/top`, { limit });
}

export async function getJournalistById(id: string | number) {
  return apiClient.get<{ journalist: Journalist }>(`/journalists/${id}`);
}

export async function followJournalist(id: string | number) {
  return apiClient.post(`/journalists/${id}/follow`);
}

export async function unfollowJournalist(id: string | number) {
  return apiClient.delete(`/journalists/${id}/follow`);
}

export async function createJournalistReview(id: string | number, data: { rating: number; comment?: string }) {
  return apiClient.post(`/journalists/${id}/review`, data);
}

// Search
export async function searchProducts(query: string, params?: { page?: number; limit?: number; sortBy?: string }) {
  return getProducts({ search: query, ...params });
}

// Auth
export async function login(email: string, password: string) {
  return apiClient.post<{ token: string; user: User }>('/auth/login', { email, password });
}

export async function register(data: {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role?: string;
}) {
  return apiClient.post<{ token: string; user: User }>('/auth/register', data);
}

export async function getCurrentUser() {
  return apiClient.get<{ user: User }>('/auth/profile');
}

export async function updateProfile(data: { phone?: string; avatar?: File }) {
  const formData = new FormData();
  if (data.phone !== undefined) formData.append('phone', data.phone);
  if (data.avatar) formData.append('avatar', data.avatar);
  return apiClient.upload<{ user: User }>('/auth/profile', formData);
}

// Withdrawals
export async function createWithdrawalRequest(data: {
  amount: number;
  bankAccount?: string;
  bankName?: string;
  accountHolderName?: string;
  notes?: string;
}) {
  return apiClient.post('/withdrawals', data);
}

export async function getMyWithdrawalRequests(status?: string) {
  return apiClient.get(`/withdrawals/my-requests${status ? `?status=${status}` : ''}`);
}

export async function getWithdrawalRequestById(id: string) {
  return apiClient.get(`/withdrawals/${id}`);
}

export async function getAllWithdrawalRequests(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  return apiClient.get('/withdrawals', params);
}

export async function updateWithdrawalRequestStatus(
  id: string,
  data: { status: 'pending' | 'approved' | 'rejected' | 'completed'; adminNotes?: string }
) {
  return apiClient.put(`/withdrawals/${id}/status`, data);
}

// Banners
export async function getBanners() {
  return apiClient.get<{ banners: Banner[] }>('/banners');
}

// Hero Sliders
export async function getHeroSliders() {
  return apiClient.get<{ sliders: HeroSlider[] }>('/hero-sliders');
}

// Memberships
export async function getActiveMemberships() {
  return apiClient.get<{ memberships: Membership[] }>('/memberships');
}

export async function getMyMembership() {
  return apiClient.get<{ membership: Membership }>('/memberships/my-membership');
}

export async function createMembershipInvoice(data: { membershipId: number; extendOnly?: boolean }) {
  return apiClient.post('/qpay/membership/invoice', data);
}

export async function checkMembershipPaymentStatus(invoiceId: string) {
  return apiClient.get(`/qpay/membership/check/${invoiceId}`);
}

// QPay
export async function createQPayInvoice(data: CreateQPayInvoiceData) {
  return apiClient.post('/qpay/invoice', data);
}

export async function checkQPayPaymentStatus(invoiceId: string) {
  return apiClient.get(`/qpay/check/${invoiceId}`);
}

export async function getOrderByInvoice(invoiceId: string) {
  return apiClient.get<{ order: Order }>(`/qpay/order/${invoiceId}`);
}

export async function createUniqueProductInvoice(productId: string | number) {
  return apiClient.post('/qpay/invoice', {
    productId,
    amount: 2000,
    description: 'Онцгой бүтээгдэхүүн болгох төлбөр',
  });
}

export async function createWalletRechargeInvoice(amount: number) {
  return apiClient.post('/qpay/wallet/recharge', { amount });
}

export async function checkWalletRechargeStatus(invoiceId: string) {
  return apiClient.get(`/qpay/wallet/check/${invoiceId}`);
}

export async function payWithWallet(data: { productId: string; amount: number }) {
  return apiClient.post('/qpay/wallet/pay', data);
}

// Wishlist
export async function addToWishlist(productId: number | string) {
  return apiClient.post<{ wishlist: WishlistItem }>('/wishlist', { productId });
}

export async function removeFromWishlist(productId: number | string) {
  return apiClient.delete(`/wishlist/${productId}`);
}

export async function getWishlist(params?: { page?: number; limit?: number }) {
  return apiClient.get<{ wishlist: WishlistItem[] }>('/wishlist', params);
}

export async function checkWishlist(productId: number | string) {
  return apiClient.get<{ inWishlist: boolean }>(`/wishlist/check/${productId}`);
}

export async function getWishlistStatus(productIds: (number | string)[]) {
  return apiClient.post<{ statuses: Record<string, boolean> }>('/wishlist/status', { productIds });
}

// Copyright Reports
export async function createCopyrightReport(data: CreateCopyrightReportData) {
  return apiClient.post('/copyright-reports', data);
}

// FAQs
export async function getFAQs() {
  return apiClient.get('/faqs');
}

// Similar File Requests
export async function createSimilarFileRequest(data: CreateSimilarFileRequestData) {
  return apiClient.post('/similar-file-requests', data);
}

export async function getMySimilarFileRequests(status?: string) {
  return apiClient.get(`/similar-file-requests/my-requests${status ? `?status=${status}` : ''}`);
}

export async function getJournalistSimilarFileRequests(status?: string) {
  return apiClient.get(`/similar-file-requests/journalist/requests${status ? `?status=${status}` : ''}`);
}

export async function completeSimilarFileRequest(id: string, data?: { journalistNotes?: string }) {
  return apiClient.put(`/similar-file-requests/journalist/${id}/complete`, data || {});
}

