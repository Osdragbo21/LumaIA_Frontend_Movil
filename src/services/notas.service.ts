// [MÓVIL] Ruta: src/services/notas.service.ts

import axios from 'axios';
import { apiClient } from '../config/api.client';

export interface NotaPersonal {
  _id: string;
  contenido: string;
  fecha_creacion: string;
}

export interface CreateNotaInput {
  usuario_id: string;
  contenido: string;
  fecha_creacion: string;
}

const handleGraphQLError = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.data?.errors) {
    throw new Error(error.response.data.errors[0].message);
  }
  throw new Error('Ocurrió un error inesperado al conectar con el servidor.');
};

export const obtenerNotas = async (usuario_id: string): Promise<NotaPersonal[]> => {
  const query = `
    query ObtenerNotasPersonales($usuario_id: ID!) {
      obtenerNotasPersonalesPorUsuario(usuario_id: $usuario_id) {
        _id
        contenido
        fecha_creacion
      }
    }
  `;
  try {
    const response = await apiClient.post('', { query, variables: { usuario_id } });
    if (response.data.errors?.length > 0) throw new Error(response.data.errors[0].message);
    return response.data.data.obtenerNotasPersonalesPorUsuario || [];
  } catch (error) {
    handleGraphQLError(error);
    return [];
  }
};

export const crearNota = async (input: CreateNotaInput): Promise<NotaPersonal> => {
  const mutation = `
    mutation CrearNotaPersonal($input: CreateNotaPersonalInput!) {
      crearNotaPersonal(createNotaPersonalInput: $input) {
        _id
        contenido
      }
    }
  `;
  try {
    const response = await apiClient.post('', { query: mutation, variables: { input } });
    if (response.data.errors?.length > 0) throw new Error(response.data.errors[0].message);
    return response.data.data.crearNotaPersonal;
  } catch (error) {
    handleGraphQLError(error);
    throw error;
  }
};