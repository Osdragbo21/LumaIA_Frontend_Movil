// [MÓVIL] Ruta: src/services/analitica.service.ts

import axios from 'axios';
import { apiClient } from '../config/api.client';
import { AnaliticaDashboard } from '../types';

export const obtenerMiAnaliticaCuidador = async (dias: number = 7): Promise<AnaliticaDashboard> => {
  const query = `
    query ObtenerMiAnaliticaCuidador($dias: Int!) {
      obtenerMiAnaliticaCuidador(dias: $dias) {
        adherencia { fecha retraso_minutos }
        intenciones { intencion cantidad distancia_promedio }
        seguridad_dfs { permitidas bloqueadas }
        ruta_bfs_optima
        escalamiento_ucs { nombre costo_minutos costo_acumulado }
        optimizacion_hill_climbing { iteracion retraso_actual ajuste }
      }
    }
  `;
  try {
    const response = await apiClient.post('', { query, variables: { dias } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.obtenerMiAnaliticaCuidador;
  } catch (error) {
    throw error;
  }
};