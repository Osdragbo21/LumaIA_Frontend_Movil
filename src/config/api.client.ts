// [MÓVIL] Ruta: src/config/api.client.ts

import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// RECUERDA: Cambiar a la IP local de tu PC donde corre NestJS
export const apiClient = axios.create({
  baseURL: '  https://rebuilt-shakily-cinch.ngrok-free.dev/graphql', 
  timeout: 45000, // <-- CORREGIDO: 45 segundos para dar tiempo a Ollama
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return Promise.reject(new Error('El servidor tardó demasiado en responder. Si usas IA Local, espera un momento.'));
    }
    if (!error.response) {
      return Promise.reject(new Error('No se pudo conectar con el servidor. Verifica tu red.'));
    }
    return Promise.reject(error);
  }
);