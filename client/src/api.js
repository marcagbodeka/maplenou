import axios from 'axios';

// Build base URL to always target backend /api routes
const root = import.meta.env.VITE_API_URL || '';
const baseURL = root
  ? (root.endsWith('/api') ? root : `${root}/api`)
  : '/api';

export const api = axios.create({ baseURL });


