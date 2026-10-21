// [MÓVIL] Ruta: src/services/medicamentos.service.ts

import axios from 'axios';
import { apiClient } from '../config/api.client';
import { Medicamento } from '../types';

const handleGraphQLError = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.data?.errors) {
    throw new Error(error.response.data.errors[0].message);
  }
  throw error;
};

export const obtenerMedicamentos = async (usuario_id: string): Promise<Medicamento[]> => {
  if (!usuario_id) throw new Error("Sesión inactiva.");

  const query = `
    query ObtenerMedicamentos($usuario_id: ID!) {
      obtenerMedicamentosPorUsuario(usuario_id: $usuario_id) {
        _id
        nombre_farmaco
        dosis
        frecuencia_horas
        horarios_especificos
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

    return response.data.data.obtenerMedicamentosPorUsuario || [];
  } catch (error) {
    handleGraphQLError(error);
    return [];
  }
};