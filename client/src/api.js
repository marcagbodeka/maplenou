import axios from 'axios';

// Use Vercel-provided env in production, fallback to dev proxy
const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
});


