// [MÓVIL] Ruta: src/services/medicamentos.service.ts

import axios from 'axios';
import { apiClient } from '../config/api.client';
import { Medicamento } from '../types';

const handleGraphQLError = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.data?.errors) {
    throw new Error(error.response.data.errors[0].message);
  }
  throw new Error('Ocurrió un error inesperado al conectar con el servidor.');
};

export const obtenerMedicamentos = async (usuario_id: string): Promise<Medicamento[]> => {
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
    const response = await apiClient.post('', { query, variables: { usuario_id } });
    if (response.data.errors?.length > 0) throw new Error(response.data.errors[0].message);
    return response.data.data.obtenerMedicamentosPorUsuario || [];
  } catch (error) {
    handleGraphQLError(error);
    return [];
  }
};

export interface CreateMedicamentoInput {
  usuario_id: string;
  nombre_farmaco: string;
  dosis: string;
  frecuencia_horas?: number;
  horarios_especificos: string[];
}

export const crearMedicamento = async (input: CreateMedicamentoInput): Promise<Medicamento> => {
  const mutation = `
    mutation CrearMedicamento($input: CreateMedicamentoInput!) {
      crearMedicamento(createMedicamentoInput: $input) {
        _id
        nombre_farmaco
        dosis
      }
    }
  `;
  try {
    const response = await apiClient.post('', { query: mutation, variables: { input } });
    if (response.data.errors?.length > 0) throw new Error(response.data.errors[0].message);
    return response.data.data.crearMedicamento;
  } catch (error) {
    handleGraphQLError(error);
    throw error;
  }
};