// [MÓVIL] Ruta: src/services/notas.service.ts

import axios from 'axios';
import { apiClient } from '../config/api.client';
import { NotaPersonal } from '../types';

const handleGraphQLError = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.data?.errors) {
    throw new Error(error.response.data.errors[0].message);
  }
  throw new Error('Ocurrió un error inesperado al conectar con el servidor.');
};

export const obtenerNotas = async (usuario_id: string): Promise<NotaPersonal[]> => {
  const query = `query ObtenerNotas($usuario_id: ID!) { obtenerNotasPersonalesPorUsuario(usuario_id: $usuario_id) { _id contenido fecha_creacion } }`;
  try {
    const response = await apiClient.post('', { query, variables: { usuario_id } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.obtenerNotasPersonalesPorUsuario || [];
  } catch (error) { handleGraphQLError(error); return []; }
};

export const obtenerNotasPapelera = async (usuario_id: string): Promise<NotaPersonal[]> => {
  const query = `query ObtenerNotasPapelera($usuario_id: ID!) { obtenerNotasPapelera(usuario_id: $usuario_id) { _id contenido fecha_creacion fecha_eliminacion } }`;
  try {
    const response = await apiClient.post('', { query, variables: { usuario_id } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.obtenerNotasPapelera || [];
  } catch (error) { handleGraphQLError(error); return []; }
};

export const crearNota = async (input: any): Promise<NotaPersonal> => {
  const mutation = `mutation CrearNota($input: CreateNotaPersonalInput!) { crearNotaPersonal(createNotaPersonalInput: $input) { _id } }`;
  try {
    const response = await apiClient.post('', { query: mutation, variables: { input } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.crearNotaPersonal;
  } catch (error) { handleGraphQLError(error); throw error; }
};

export const actualizarNota = async (input: any): Promise<NotaPersonal> => {
  const mutation = `mutation ActualizarNota($input: UpdateNotaPersonalInput!) { actualizarNotaPersonal(updateNotaPersonalInput: $input) { _id } }`;
  try {
    const response = await apiClient.post('', { query: mutation, variables: { input } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.actualizarNotaPersonal;
  } catch (error) { handleGraphQLError(error); throw error; }
};

export const eliminarNota = async (id: string): Promise<NotaPersonal> => {
  const mutation = `mutation EliminarNota($id: ID!) { eliminarNotaPersonal(id: $id) { _id } }`;
  try {
    const response = await apiClient.post('', { query: mutation, variables: { id } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.eliminarNotaPersonal;
  } catch (error) { handleGraphQLError(error); throw error; }
};

export const restaurarNota = async (id: string): Promise<NotaPersonal> => {
  const mutation = `mutation RestaurarNota($id: ID!) { restaurarNotaPersonal(id: $id) { _id } }`;
  try {
    const response = await apiClient.post('', { query: mutation, variables: { id } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.restaurarNotaPersonal;
  } catch (error) { handleGraphQLError(error); throw error; }
};