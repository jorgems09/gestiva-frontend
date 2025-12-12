import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const USER_EMAIL = import.meta.env.VITE_USER_EMAIL || 'admin@gestiva.com';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    // Mantener x-user-email como fallback para compatibilidad
    'x-user-email': USER_EMAIL,
  },
});

// Interceptor para agregar token JWT a todas las requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gestiva_token');
    if (token) {
      // Priorizar JWT sobre x-user-email
      config.headers.Authorization = `Bearer ${token}`;
      // Remover x-user-email si hay token JWT
      delete config.headers['x-user-email'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar errores de autenticación
    if (error.response?.status === 401) {
      // Token inválido o expirado
      const token = localStorage.getItem('gestiva_token');
      if (token) {
        // Solo limpiar si había un token (no si es el primer acceso)
        localStorage.removeItem('gestiva_token');
        localStorage.removeItem('gestiva_user');
        // Opcional: redirigir a login
        // window.location.href = '/login';
      }
    }

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

