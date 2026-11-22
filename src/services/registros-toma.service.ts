// [MÓVIL] Ruta: src/services/registros-toma.service.ts

import axios from 'axios';
import { apiClient } from '../config/api.client';
import { RegistroToma } from '../types';

const handleGraphQLError = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.data?.errors) {
    throw new Error(error.response.data.errors[0].message);
  }
  throw error;
};

export const obtenerTomasHoy = async (usuario_id: string): Promise<RegistroToma[]> => {
  const query = `query ObtenerTomasHoy($usuario_id: ID!) { obtenerTomasHoy(usuario_id: $usuario_id) { _id medicamento_id estado_toma fecha_programada } }`;
  try {
    const response = await apiClient.post('', { query, variables: { usuario_id } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.obtenerTomasHoy || [];
  } catch (error) { handleGraphQLError(error); return []; }
};

// CORRECCIÓN: Ahora enviamos la hora programada
export const confirmarToma = async (medicamento_id: string, hora_programada: string): Promise<RegistroToma> => {
  const mutation = `mutation ConfirmarToma($medicamento_id: ID!, $hora_programada: String!) { confirmarTomaMedicamento(medicamento_id: $medicamento_id, hora_programada: $hora_programada) { _id estado_toma } }`;
  try {
    const response = await apiClient.post('', { query: mutation, variables: { medicamento_id, hora_programada } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.confirmarTomaMedicamento;
  } catch (error) { handleGraphQLError(error); throw error; }
};