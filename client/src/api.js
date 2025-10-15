import axios from 'axios';

// Build base URL to always target backend /api routes
const root = import.meta.env.VITE_API_URL || '';
const baseURL = root
  ? (root.endsWith('/api') ? root : `${root}/api`)
  : '/api';

export const api = axios.create({ baseURL });

// Attach JWT from localStorage automatically if present
api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('maplenou_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      const token = parsed?.token;
      if (token && !config.headers?.Authorization) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {}
  return config;
});


