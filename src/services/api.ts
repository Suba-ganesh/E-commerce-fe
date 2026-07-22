/**
 * API client service for Chennis Backend integration.
 * Wraps fetch requests with default configuration, error handling, and authorization.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, data: any, message?: string) {
    super(message || `API Error: ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Common request helper
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customConfig } = options;

  // Format query parameters
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Get authorization token from local storage
  const token = localStorage.getItem('chennis_auth_token');

  const isFormData = customConfig.body instanceof FormData;

  const defaultHeaders: any = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as any),
  };

  // Clean placeholder headers
  if (defaultHeaders['Content-Type'] === 'none') {
    delete defaultHeaders['Content-Type'];
  }

  const config: RequestInit = {
    method: 'GET',
    ...customConfig,
    headers: defaultHeaders as HeadersInit,
  };

  try {
    const response = await fetch(url, config);
    const data = response.status !== 204 ? await response.json().catch(() => null) : null;

    if (!response.ok) {
      if (response.status === 401) {
        // Handle token expiration globally
        localStorage.removeItem('chennis_auth_token');
        localStorage.removeItem('Session');
        window.dispatchEvent(new Event('auth:unauthorized'));
        // Optional: window.location.href = '/'; 
      }
      throw new ApiError(response.status, data, data?.message || response.statusText);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or other fetch-related issues
    throw new Error(error instanceof Error ? error.message : 'Network failure or server is unreachable');
  }
}

// API methods convenience wrapper
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) }),

  put: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body: data instanceof FormData ? data : JSON.stringify(data) }),

  patch: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body: data instanceof FormData ? data : JSON.stringify(data) }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
