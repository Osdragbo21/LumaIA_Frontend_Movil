// [MÓVIL] Ruta: src/hooks/usePushNotifications.ts

import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { apiClient } from '../config/api.client';
import { useAuthStore } from '../store/useAuthStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const { usuarioId } = useAuthStore();

  useEffect(() => {
    if (!usuarioId) return;

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        enviarTokenAlBackend(usuarioId, token);
      }
    });
  }, [usuarioId]);

  const enviarTokenAlBackend = async (id: string, token: string) => {
    const mutation = `
      mutation RegistrarToken($usuario_id: ID!, $token: String!) {
        registrarTokenDispositivo(usuario_id: $usuario_id, token: $token) {
          _id
        }
      }
    `;
    try {
      await apiClient.post('', { query: mutation, variables: { usuario_id: id, token } });
      console.log('✅ Token Push registrado en MongoDB');
    } catch (error) {
      console.error('❌ Error al registrar Token Push:', error);
    }
  };

  async function registerForPushNotificationsAsync() {
    let token;

    // CORRECCIÓN: Manejo seguro para Expo Go en Android
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      } catch (e) {
        console.log('Aviso: No se pudo crear el canal de notificaciones (Comportamiento normal en Expo Go).');
      }
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Permiso denegado para notificaciones push');
        return;
      }

      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
          console.log('Aviso: Project ID no encontrado. Asegúrate de tenerlo en app.json si usas EAS.');
          // En Expo Go a veces funciona sin Project ID, así que intentamos obtenerlo de todos modos
        }
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      } catch (e) {
        console.log('Error obteniendo el Push Token:', e);
      }
    } else {
      console.log('Las notificaciones Push solo funcionan en dispositivos físicos.');
    }

    return token;
  }

  return { expoPushToken };
};