// [MÓVIL] Ruta: src/store/useAuthStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Enum_Rol } from '../types/index';

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
      // CRÍTICO: Aquí le decimos a Zustand que use el almacenamiento nativo de React Native
      storage: createJSONStorage(() => AsyncStorage) 
    }
  )
);