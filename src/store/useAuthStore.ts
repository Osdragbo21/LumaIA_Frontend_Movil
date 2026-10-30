// [MÓVIL] Ruta: src/store/useAuthStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Enum_Rol } from '../types/index';

// CORRECCIÓN S-09: Adaptador personalizado para cifrar los datos en móviles
const secureStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(name);
    }
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(name, value);
    } else {
      await SecureStore.setItemAsync(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(name);
    } else {
      await SecureStore.deleteItemAsync(name);
    }
  },
};

interface AuthState {
  token: string | null;
  usuarioId: string | null;
  rol: Enum_Rol | null;
  isAuthenticated: boolean;
  login: (token: string, usuarioId: string, rol: Enum_Rol) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      usuarioId: null,
      rol: null,
      isAuthenticated: false,
      login: (token, usuarioId, rol) => set({ token, usuarioId, rol, isAuthenticated: true }),
      logout: () => set({ token: null, usuarioId: null, rol: null, isAuthenticated: false }),
    }),
    { 
      name: 'luma-auth-storage',
      // Usamos nuestro adaptador cifrado en lugar de AsyncStorage
      storage: createJSONStorage(() => secureStorage) 
    }
  )
);