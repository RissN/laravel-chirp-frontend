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
 * Response interceptor: Rewrite localhost URLs to API_BASE (ngrok) URL.
 * This fixes image/media URLs stored in the database as http://127.0.0.1:8000/storage/...
 * so they become accessible from the internet via ngrok.
 */
if (API_BASE) {
  const LOCAL_ORIGINS = [
    'http://127.0.0.1:8000',
    'http://localhost:8000',
  ];

  const rewriteUrls = (data: any): any => {
    if (typeof data === 'string') {
      let result = data;
      for (const origin of LOCAL_ORIGINS) {
        result = result.replaceAll(origin, API_BASE);
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
