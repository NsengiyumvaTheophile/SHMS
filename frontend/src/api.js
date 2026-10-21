import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const publicAuth = url.includes('/auth/login') || url.includes('/auth/forgot') || url.includes('/auth/reset') || url.includes('/public/');
    if (err.response?.status === 401 && !publicAuth) {
      localStorage.removeItem('shms_token');
      localStorage.removeItem('shms_user');
      const path = window.location.pathname;
      if (!['/login', '/forgot-password', '/reset-password', '/'].includes(path)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export function money(n) {
  return `${Number(n || 0).toLocaleString()} RWF`;
}

export function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString();
}

export function statusBadge(status) {
  if (!status) return 'badge';
  return `badge badge-${String(status).toLowerCase()}`;
}
