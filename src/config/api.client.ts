// [MÓVIL] Ruta: src/config/api.client.ts

import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// RECUERDA: Cambiar a la IP local de tu PC donde corre NestJS
export const apiClient = axios.create({
  baseURL: 'https://rebuilt-shakily-cinch.ngrok-free.dev/graphql', // Cambia esto a tu URL de GraphQL
  timeout: 10000, // Timeout estricto de 10 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Peticiones (Inyectar Token)
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de Respuestas (Manejo de Timeout)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return Promise.reject(new Error('El servidor tardó demasiado en responder. Revisa tu conexión a internet.'));
    }
    if (!error.response) {
      return Promise.reject(new Error('No se pudo conectar con el servidor. Verifica tu red.'));
    }
    return Promise.reject(error);
  }
);