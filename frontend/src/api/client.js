import axios from 'axios';

const getBaseURL = () => {
  let customUrl = import.meta.env.VITE_API_URL;
  if (customUrl && customUrl.trim() !== '') {
    customUrl = customUrl.trim().replace(/\/$/, '');
    if (!customUrl.endsWith('/api')) {
      customUrl += '/api';
    }
    return customUrl;
  }
  // In production deployments (e.g. Vercel), fallback to deployed Render backend API URL
  if (
    typeof window !== 'undefined' &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1')
  ) {
    return 'https://e-fir-9tpa.onrender.com/api';
  }
  return '/api';
};


const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 45000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('efir_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error message extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred.';

    // If session expired or unauthorized on protected routes
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('efir_token');
        localStorage.removeItem('efir_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
