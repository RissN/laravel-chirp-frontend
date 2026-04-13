import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
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
 * Response interceptor: Rewrite storage URLs to go through Vercel's proxy function.
 * e.g. "http://127.0.0.1:8000/storage/uploads/img.jpg" → "/api/storage/uploads/img.jpg"
 * 
 * The /api/storage/* route is handled by a Vercel Edge Function that fetches
 * from ngrok with the ngrok-skip-browser-warning header, bypassing the interstitial.
 */
if (API_BASE) {
  const LOCAL_ORIGINS = [
    'http://127.0.0.1:8000',
    'http://localhost:8000',
    API_BASE,
  ];

  const rewriteUrls = (data: any): any => {
    if (typeof data === 'string') {
      let result = data;
      for (const origin of LOCAL_ORIGINS) {
        // Rewrite "{origin}/storage/..." → "/api/storage?path=..."
        if (result.includes(`${origin}/storage/`)) {
          const pathName = result.replace(`${origin}/storage/`, '');
          result = `/api/storage?path=${encodeURIComponent(pathName)}`;
        }
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
