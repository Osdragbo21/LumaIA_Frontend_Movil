// [MÓVIL] Ruta: src/services/analitica.service.ts

import axios from 'axios';
import { apiClient } from '../config/api.client';
import { AnaliticaDashboard } from '../types';

const handleGraphQLError = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.data?.errors) {
    throw new Error(error.response.data.errors[0].message);
  }
  throw new Error('Ocurrió un error inesperado al conectar con el servidor.');
};

export const obtenerMiAnaliticaCuidador = async (dias: number = 7): Promise<AnaliticaDashboard> => {
  const query = `
    query ObtenerMiAnaliticaCuidador($dias: Int!) {
      obtenerMiAnaliticaCuidador(dias: $dias) {
        adherencia {
          fecha
          retraso_minutos
        }
        intenciones {
          intencion
          cantidad
          distancia_promedio
        }
        seguridad_dfs {
          permitidas
          bloqueadas
        }
      }
    }
  `;
  try {
    const response = await apiClient.post('', { query, variables: { dias } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.obtenerMiAnaliticaCuidador;
  } catch (error) {
    handleGraphQLError(error);
    throw error;
  }
};