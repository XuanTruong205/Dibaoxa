import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token if present
api.interceptors.request.use(
  (config) => {
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
    return Promise.reject(apiError);
  }
);

export default api;
