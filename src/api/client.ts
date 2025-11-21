import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const USER_EMAIL = import.meta.env.VITE_USER_EMAIL || 'admin@gestiva.com';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-user-email': USER_EMAIL,
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Error desconocido';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  },
);

export default apiClient;

