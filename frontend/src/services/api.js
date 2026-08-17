import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

const getCache = new Map();

function cacheKey(url, config = {}) {
  const params = new URLSearchParams();
  Object.entries(config.params || {}).sort(([left], [right]) => left.localeCompare(right)).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  return `${url}?${params.toString()}`;
}

export function cachedGet(url, config = {}, ttlMs = 30_000) {
  const key = cacheKey(url, config);
  const cached = getCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;
  const promise = api.get(url, config).catch((error) => {
    getCache.delete(key);
    throw error;
  });
  getCache.set(key, { promise, expiresAt: Date.now() + ttlMs });
  return promise;
}

// Request Interceptor: Attach JWT Bearer Token if present
api.interceptors.request.use(
  (config) => {
    if (String(config.method || 'get').toLowerCase() !== 'get') getCache.clear();
    const token = localStorage.getItem('dibaoxa_token') || sessionStorage.getItem('dibaoxa_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ.';
    const apiError = new Error(message);
    apiError.status = error.response?.status || 0;
    apiError.code = error.response?.data?.code || 'NETWORK_ERROR';
    apiError.details = error.response?.data?.errors || [];
    return Promise.reject(apiError);
  }
);

export default api;
