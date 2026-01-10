// API utility for contentadmin
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Helper function for API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
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
      errorMessage = `HTTP error! status: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    return apiCall('/api/admin/dashboard/stats');
  },
};

// Users API
export const usersApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; role?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    
    const query = queryParams.toString();
    return apiCall(`/api/admin/users${query ? `?${query}` : ''}`);
  },
  getById: async (id: string | number) => {
    return apiCall(`/api/admin/users/${id}`);
  },
  create: async (userData: any) => {
    return apiCall('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  update: async (id: string | number, userData: any) => {
    return apiCall(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
  delete: async (id: string | number) => {
    return apiCall(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  },
  updateSubscription: async (userId: string | number, subscriptionData: {
    subscriptionStartDate?: string | null;
    subscriptionEndDate?: string | null;
    membership_type?: number | null;
  }) => {
    return apiCall(`/api/admin/users/${userId}/subscription`, {
      method: 'PUT',
      body: JSON.stringify(subscriptionData),
    });
  },
};

// Products API
export const productsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; categoryId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
    
    const query = queryParams.toString();
    return apiCall(`/api/admin/products${query ? `?${query}` : ''}`);
  },
  getById: async (id: string | number) => {
    return apiCall(`/api/products/${id}`);
  },
  create: async (productData: any) => {
    return apiCall('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },
  update: async (id: string | number, productData: any) => {
    return apiCall(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },
  delete: async (id: string | number) => {
    return apiCall(`/api/products/${id}`, {
      method: 'DELETE',
    });
  },
};

// Categories API
export const categoriesApi = {
  getAll: async (tree?: boolean) => {
    const query = tree ? '?tree=true' : '';
    return apiCall(`/api/categories${query}`);
  },
  getAllAdmin: async () => {
    return apiCall('/api/admin/categories');
  },
  getById: async (id: string | number) => {
    return apiCall(`/api/categories/${id}`);
  },
  create: async (categoryData: { name: string; icon?: string; description?: string; isActive?: boolean }) => {
    return apiCall('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },
  update: async (id: string | number, categoryData: { name?: string; icon?: string; description?: string; isActive?: boolean }) => {
    return apiCall(`/api/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },
  delete: async (id: string | number) => {
    return apiCall(`/api/admin/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// Subcategories API
export const subcategoriesApi = {
  getAll: async (categoryId?: string | number) => {
    const query = categoryId ? `?categoryId=${categoryId}` : '';
    return apiCall(`/api/admin/subcategories${query}`);
  },
  create: async (subcategoryData: { categoryId: number; name: string; description?: string; isActive?: boolean }) => {
    return apiCall('/api/admin/subcategories', {
      method: 'POST',
      body: JSON.stringify(subcategoryData),
    });
  },
  update: async (id: string | number, subcategoryData: { categoryId?: number; name?: string; description?: string; isActive?: boolean }) => {
    return apiCall(`/api/admin/subcategories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subcategoryData),
    });
  },
  delete: async (id: string | number) => {
    return apiCall(`/api/admin/subcategories/${id}`, {
      method: 'DELETE',
    });
  },
};

// Orders API
export const ordersApi = {
  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    
    const query = queryParams.toString();
    return apiCall(`/api/admin/orders${query ? `?${query}` : ''}`);
  },
  getById: async (id: string | number) => {
    return apiCall(`/api/admin/orders/${id}`);
  },
  update: async (id: string | number, orderData: any) => {
    return apiCall(`/api/admin/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  },
};

// QPay API
export const qpayApi = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return apiCall(`/api/admin/orders/qpay${query ? `?${query}` : ''}`);
  },
};

// Banners API
export const bannersApi = {
  getAll: async () => {
    return apiCall('/api/banners');
  },
  getAllAdmin: async () => {
    return apiCall('/api/admin/banners');
  },
  getById: async (id: string | number) => {
    return apiCall(`/api/banners/${id}`);
  },
  create: async (bannerData: { imageUrl: string; title?: string; linkUrl?: string; order?: number; isActive?: boolean }) => {
    return apiCall('/api/admin/banners', {
      method: 'POST',
      body: JSON.stringify(bannerData),
    });
  },
  update: async (id: string | number, bannerData: { imageUrl?: string; title?: string; linkUrl?: string; order?: number; isActive?: boolean }) => {
    return apiCall(`/api/admin/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bannerData),
    });
  },
  delete: async (id: string | number) => {
    return apiCall(`/api/admin/banners/${id}`, {
      method: 'DELETE',
    });
  },
};

// Role Permissions API
export const rolePermissionsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return apiCall(`/api/admin/role-permissions${query ? `?${query}` : ''}`);
  },
  getById: async (id: string | number) => {
    return apiCall(`/api/admin/role-permissions/${id}`);
  },
  create: async (rolePermissionData: { roleName: string; description?: string; permissions: any; isActive?: boolean }) => {
    return apiCall('/api/admin/role-permissions', {
      method: 'POST',
      body: JSON.stringify(rolePermissionData),
    });
  },
  update: async (id: string | number, rolePermissionData: { roleName?: string; description?: string; permissions?: any; isActive?: boolean }) => {
    return apiCall(`/api/admin/role-permissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rolePermissionData),
    });
  },
  delete: async (id: string | number) => {
    return apiCall(`/api/admin/role-permissions/${id}`, {
      method: 'DELETE',
    });
  },
};

// Memberships API
export const membershipsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    
    const query = queryParams.toString();
    return apiCall(`/api/admin/memberships${query ? `?${query}` : ''}`);
  },
  getById: async (id: string | number) => {
    return apiCall(`/api/admin/memberships/${id}`);
  },
  create: async (membershipData: { name: string; price: number; maxPosts: number; advantages?: string[]; description?: string; isActive?: boolean; order?: number; percentage?: number }) => {
    return apiCall('/api/admin/memberships', {
      method: 'POST',
      body: JSON.stringify(membershipData),
    });
  },
  update: async (id: string | number, membershipData: { name?: string; price?: number; maxPosts?: number; advantages?: string[]; description?: string; isActive?: boolean; order?: number; percentage?: number }) => {
    return apiCall(`/api/admin/memberships/${id}`, {
      method: 'PUT',
      body: JSON.stringify(membershipData),
    });
  },
  delete: async (id: string | number) => {
    return apiCall(`/api/admin/memberships/${id}`, {
      method: 'DELETE',
    });
  },
};

// FAQs API
export const faqsApi = {
  getAll: async () => {
    return apiCall('/api/admin/faqs');
  },
  getById: async (id: string | number) => {
    return apiCall(`/api/admin/faqs/${id}`);
  },
  create: async (faqData: { question: { mn: string; en: string }; answer: { mn: string; en: string }; order?: number; isActive?: boolean }) => {
    return apiCall('/api/admin/faqs', {
      method: 'POST',
      body: JSON.stringify(faqData),
    });
  },
  update: async (id: string | number, faqData: { question?: { mn: string; en: string }; answer?: { mn: string; en: string }; order?: number; isActive?: boolean }) => {
    return apiCall(`/api/admin/faqs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(faqData),
    });
  },
  delete: async (id: string | number) => {
    return apiCall(`/api/admin/faqs/${id}`, {
      method: 'DELETE',
    });
  },
};

