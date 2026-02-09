import { API_BASE_URL, ERROR_MESSAGES } from '@/constants';
import type { ApiError } from '@/types';

/**
 * Enhanced API client with proper error handling and types
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = ERROR_MESSAGES.SERVER_ERROR;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
        } else {
          const text = await response.text();
          if (text) errorMessage = text;
        }
      } catch {
        errorMessage = `API error: ${response.status} ${response.statusText}`;
      }

      const apiError: ApiError = {
        message: errorMessage,
        status: response.status,
        code: response.status.toString(),
      };

      // Handle specific status codes
      if (response.status === 401) {
        apiError.message = ERROR_MESSAGES.UNAUTHORIZED;
        // Optionally clear token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else if (response.status === 403) {
        apiError.message = ERROR_MESSAGES.FORBIDDEN;
      } else if (response.status === 404) {
        apiError.message = ERROR_MESSAGES.NOT_FOUND;
      }

      throw apiError;
    }

    return response.json();
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const networkError: ApiError = {
          message: ERROR_MESSAGES.NETWORK_ERROR,
          status: 0,
        };
        throw networkError;
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    const url = `${endpoint}${query ? `?${query}` : ''}`;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const networkError: ApiError = {
          message: ERROR_MESSAGES.NETWORK_ERROR,
          status: 0,
        };
        throw networkError;
      }
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

