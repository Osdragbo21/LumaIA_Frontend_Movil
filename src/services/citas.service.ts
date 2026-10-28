// [MÓVIL] Ruta: src/services/citas.service.ts

import axios from 'axios';
import { apiClient } from '../config/api.client';
import { Cita } from '../types';

const handleGraphQLError = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.data?.errors) {
    throw new Error(error.response.data.errors[0].message);
  }
  throw new Error('Ocurrió un error inesperado al conectar con el servidor.');
};

export const obtenerCitas = async (usuario_id: string): Promise<Cita[]> => {
  const query = `query ObtenerCitas($usuario_id: ID!) { obtenerCitasPorUsuario(usuario_id: $usuario_id) { _id titulo_evento fecha_hora ubicacion estado } }`;
  try {
    const response = await apiClient.post('', { query, variables: { usuario_id } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.obtenerCitasPorUsuario || [];
  } catch (error) { handleGraphQLError(error); return []; }
};

export const obtenerCitasPapelera = async (usuario_id: string): Promise<Cita[]> => {
  const query = `query ObtenerCitasPapelera($usuario_id: ID!) { obtenerCitasPapelera(usuario_id: $usuario_id) { _id titulo_evento fecha_hora ubicacion estado fecha_eliminacion } }`;
  try {
    const response = await apiClient.post('', { query, variables: { usuario_id } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.obtenerCitasPapelera || [];
  } catch (error) { handleGraphQLError(error); return []; }
};

export const crearCita = async (input: any): Promise<Cita> => {
  const mutation = `mutation CrearCita($input: CreateCitaInput!) { crearCita(createCitaInput: $input) { _id } }`;
  try {
    const response = await apiClient.post('', { query: mutation, variables: { input } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.crearCita;
  } catch (error) { handleGraphQLError(error); throw error; }
};

export const actualizarCita = async (input: any): Promise<Cita> => {
  const mutation = `mutation ActualizarCita($input: UpdateCitaInput!) { actualizarCita(updateCitaInput: $input) { _id } }`;
  try {
    const response = await apiClient.post('', { query: mutation, variables: { input } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.actualizarCita;
  } catch (error) { handleGraphQLError(error); throw error; }
};

export const eliminarCita = async (id: string): Promise<Cita> => {
  const mutation = `mutation EliminarCita($id: ID!) { eliminarCita(id: $id) { _id } }`;
  try {
    const response = await apiClient.post('', { query: mutation, variables: { id } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.eliminarCita;
  } catch (error) { handleGraphQLError(error); throw error; }
};

export const restaurarCita = async (id: string): Promise<Cita> => {
  const mutation = `mutation RestaurarCita($id: ID!) { restaurarCita(id: $id) { _id } }`;
  try {
    const response = await apiClient.post('', { query: mutation, variables: { id } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.restaurarCita;
  } catch (error) { handleGraphQLError(error); throw error; }
};