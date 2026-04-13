import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
  withCredentials: !API_BASE, // Only send cookies for local dev (same origin)
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Response interceptor: Rewrite localhost storage URLs to relative paths.
 * e.g. "http://127.0.0.1:8000/storage/uploads/img.jpg" → "/storage/uploads/img.jpg"
 * 
 * In production (Vercel), relative /storage/* paths are proxied to ngrok
 * via vercel.json rewrites, avoiding ngrok's browser interstitial page.
 * In local dev, Vite proxy handles /storage/* → localhost:8000.
 */
if (API_BASE) {
  const LOCAL_ORIGINS = [
    'http://127.0.0.1:8000',
    'http://localhost:8000',
    API_BASE, // Also rewrite ngrok URLs to relative
  ];

  const rewriteUrls = (data: any): any => {
    if (typeof data === 'string') {
      let result = data;
      for (const origin of LOCAL_ORIGINS) {
        result = result.replaceAll(origin, '');
      }
      return result;
    }
    if (Array.isArray(data)) {
      return data.map(rewriteUrls);
    }
    if (data && typeof data === 'object') {
      const result: any = {};
      for (const key of Object.keys(data)) {
        result[key] = rewriteUrls(data[key]);
      }
      return result;
    }
    return data;
  };

  api.interceptors.response.use((response) => {
    response.data = rewriteUrls(response.data);
    return response;
  });
}

export default api;
