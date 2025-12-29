const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `API error: ${response.statusText || response.status}`;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } else {
        const text = await response.text();
        if (text) {
          errorMessage = text;
        }
      }
    } catch (parseError) {
      // If parsing fails, use the default error message
      errorMessage = `API error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// Products
export async function getProducts(params?: {
  page?: number;
  limit?: number;
  categoryId?: number;
  subcategoryId?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  const query = queryParams.toString();
  return fetchAPI(`/products${query ? `?${query}` : ''}`);
}

export async function getProductById(id: string | number) {
  return fetchAPI(`/products/${id}`);
}

export async function getFeaturedProducts(limit: number = 8) {
  return fetchAPI(`/products/featured?limit=${limit}`);
}

// Categories
export async function getCategories() {
  return fetchAPI('/categories');
}

export async function getCategoryById(id: string | number) {
  return fetchAPI(`/categories/${id}`);
}

export async function getCategoryProducts(id: string | number, page: number = 1, limit: number = 20) {
  return fetchAPI(`/categories/${id}/products?page=${page}&limit=${limit}`);
}

// Journalists
export async function getTopJournalists(limit: number = 10) {
  return fetchAPI(`/journalists/top?limit=${limit}`);
}

export async function getJournalistById(id: string | number) {
  return fetchAPI(`/journalists/${id}`);
}

// Search
export async function searchProducts(query: string, params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
}) {
  return getProducts({
    search: query,
    ...params,
  });
}

// Auth
export async function login(email: string, password: string) {
  return fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(data: {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role?: string;
}) {
  return fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Withdrawal Requests
export async function createWithdrawalRequest(data: {
  amount: number;
  bankAccount?: string;
  bankName?: string;
  accountHolderName?: string;
  notes?: string;
}) {
  return fetchAPI('/withdrawals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMyWithdrawalRequests(status?: string) {
  const query = status ? `?status=${status}` : '';
  return fetchAPI(`/withdrawals/my-requests${query}`);
}

export async function getWithdrawalRequestById(id: string) {
  return fetchAPI(`/withdrawals/${id}`);
}

// Admin withdrawal requests
export async function getAllWithdrawalRequests(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  const query = queryParams.toString();
  return fetchAPI(`/withdrawals${query ? `?${query}` : ''}`);
}

export async function updateWithdrawalRequestStatus(id: string, data: {
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  adminNotes?: string;
}) {
  return fetchAPI(`/withdrawals/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Banners
export async function getBanners() {
  return fetchAPI('/banners');
}

// Journalist account
export async function getMyProducts(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  const query = queryParams.toString();
  return fetchAPI(`/products/my-products${query ? `?${query}` : ''}`);
}

export async function getMyStatistics() {
  return fetchAPI('/products/my-statistics');
}

// Create product
export async function createProduct(productData: {
  title: string;
  description: string;
  categoryId: number;
  price: number;
  pages?: number;
  size?: string;
  status?: 'new' | 'cancelled' | 'deleted';
}) {
  return fetchAPI('/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
}

// Create product with file upload (FormData)
// Backend expects multipart/form-data with 'file' and 'image' fields
export async function createProductWithFiles(formData: FormData) {
  const url = `${API_BASE_URL}/products`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Ensure all required fields are strings (FormData handles files automatically)
  // Convert numeric fields to strings if needed
  const title = formData.get('title');
  const description = formData.get('description');
  const categoryId = formData.get('categoryId');
  const price = formData.get('price');
  const status = formData.get('status') || 'new';

  // Create a new FormData to ensure proper formatting
  const uploadData = new FormData();
  
  if (title) uploadData.append('title', title as string);
  if (description) uploadData.append('description', description as string);
  if (categoryId) uploadData.append('categoryId', categoryId as string);
  if (price) uploadData.append('price', price as string);
  uploadData.append('status', status as string);

  // Add optional fields
  const pages = formData.get('pages');
  const size = formData.get('size');
  if (pages) uploadData.append('pages', pages as string);
  if (size) uploadData.append('size', size as string);

  // Add files if they exist
  const file = formData.get('file');
  const image = formData.get('image');
  if (file instanceof File) {
    uploadData.append('file', file);
  }
  if (image instanceof File) {
    uploadData.append('image', image);
  }

  const headers: Record<string, string> = {};
  // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: uploadData,
  });

  if (!response.ok) {
    let errorMessage = `API error: ${response.statusText || response.status}`;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } else {
        const text = await response.text();
        if (text) {
          errorMessage = text;
        }
      }
    } catch (parseError) {
      errorMessage = `API error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// QPay Payment API
export async function createQPayInvoice(data: {
  productId: string;
  amount: number;
  description?: string;
}) {
  return fetchAPI('/qpay/invoice', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function checkQPayPaymentStatus(invoiceId: string) {
  return fetchAPI(`/qpay/check/${invoiceId}`);
}

export async function getOrderByInvoice(invoiceId: string) {
  return fetchAPI(`/qpay/order/${invoiceId}`);
}

