// [MÓVIL] Ruta: src/services/citas.service.ts

import axios from 'axios';
import { apiClient } from '../config/api.client';
import { Cita } from '../types';

const handleGraphQLError = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.data?.errors) {
    throw new Error(error.response.data.errors[0].message);
  }
  throw error;
};

export const obtenerCitas = async (usuario_id: string): Promise<Cita[]> => {
  if (!usuario_id) throw new Error("Sesión inactiva.");

  const query = `
    query ObtenerCitas($usuario_id: ID!) {
      obtenerCitasPorUsuario(usuario_id: $usuario_id) {
        _id
        titulo_evento
        fecha_hora
        ubicacion
        estado
      }
    }
  `;

  try {
    const response = await apiClient.post('', {
      query,
      variables: { usuario_id },
    });

    if (response.data.errors?.length > 0) {
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data.obtenerCitasPorUsuario || [];
  } catch (error) {
    handleGraphQLError(error);
    return [];
  }
};