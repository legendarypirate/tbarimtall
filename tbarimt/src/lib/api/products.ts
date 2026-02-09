import { apiClient } from './client';
import type {
  Product,
  ProductsResponse,
  GetProductsParams,
  CreateProductData,
  UpdateProductData,
} from '@/types';

export const productsApi = {
  /**
   * Get products with filters
   */
  getProducts: (params?: GetProductsParams): Promise<ProductsResponse> => {
    return apiClient.get<ProductsResponse>('/products', params);
  },

  /**
   * Get product by ID
   */
  getProductById: (id: string | number): Promise<{ product: Product }> => {
    return apiClient.get<{ product: Product }>(`/products/${id}`);
  },

  /**
   * Get featured products
   */
  getFeaturedProducts: (limit: number = 8): Promise<ProductsResponse> => {
    return apiClient.get<ProductsResponse>(`/products/featured`, { limit });
  },

  /**
   * Get recent products
   */
  getRecentProducts: (limit: number = 8): Promise<ProductsResponse> => {
    return apiClient.get<ProductsResponse>(`/products/recent`, { limit });
  },

  /**
   * Get recommended products
   */
  getRecommendedProducts: (
    productId: string | number,
    limit: number = 8
  ): Promise<ProductsResponse> => {
    return apiClient.get<ProductsResponse>(`/products/recommended`, {
      productId,
      limit,
    });
  },

  /**
   * Get best selling products
   */
  getBestSellingProducts: (limit: number = 5): Promise<ProductsResponse> => {
    return apiClient.get<ProductsResponse>('/products', {
      limit,
      sortBy: 'downloads',
    });
  },

  /**
   * Create product
   */
  createProduct: (data: CreateProductData): Promise<{ product: Product }> => {
    return apiClient.post<{ product: Product }>('/products', data);
  },

  /**
   * Update product
   */
  updateProduct: (
    productId: string | number,
    data: Partial<UpdateProductData>
  ): Promise<{ product: Product }> => {
    return apiClient.put<{ product: Product }>(`/products/${productId}`, data);
  },

  /**
   * Create product with file upload
   */
  createProductWithFiles: (formData: FormData): Promise<{ product: Product }> => {
    return apiClient.upload<{ product: Product }>('/products', formData);
  },

  /**
   * Get my products (for journalists)
   */
  getMyProducts: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ProductsResponse> => {
    return apiClient.get<ProductsResponse>('/products/my-products', params);
  },

  /**
   * Get my statistics (for journalists)
   */
  getMyStatistics: (): Promise<any> => {
    return apiClient.get('/products/my-statistics');
  },
};

