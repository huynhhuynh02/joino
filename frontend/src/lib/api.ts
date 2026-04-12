import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT token & handle FormData
apiClient.interceptors.request.use((config) => {
  // If sending FormData, remove Content-Type to let Axios set it with the boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('joino_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 → logout
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('joino_token');
      localStorage.removeItem('joino_user');
      document.cookie = 'joino_token=; path=/; domain=' + window.location.hostname + '; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0';
      document.cookie = 'joino_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0';
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

type ApiResponse<T> = { success: boolean; data: T; message?: string; meta?: Record<string, unknown> };

export const api = {
  get: async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
    const res = await apiClient.get<ApiResponse<T>>(url, { params });
    return res.data.data;
  },

  post: async <T>(url: string, data?: unknown): Promise<T> => {
    const res = await apiClient.post<ApiResponse<T>>(url, data);
    return res.data.data;
  },

  put: async <T>(url: string, data?: unknown): Promise<T> => {
    const res = await apiClient.put<ApiResponse<T>>(url, data);
    return res.data.data;
  },

  delete: async <T = void>(url: string): Promise<T> => {
    const res = await apiClient.delete<ApiResponse<T>>(url);
    return res.data.data;
  },

  upload: async <T>(url: string, formData: FormData): Promise<T> => {
    const res = await apiClient.post<ApiResponse<T>>(url, formData);
    return res.data.data;
  },
};

export default apiClient;
