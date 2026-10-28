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
  const query = `query ObtenerMedicamentos($usuario_id: ID!) { obtenerMedicamentosPorUsuario(usuario_id: $usuario_id) { _id nombre_farmaco dosis frecuencia_horas horarios_especificos } }`;
  try {
    const response = await apiClient.post('', { query, variables: { usuario_id } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.obtenerMedicamentosPorUsuario || [];
  } catch (error) { handleGraphQLError(error); return []; }
};

export const obtenerMedicamentosPapelera = async (usuario_id: string): Promise<Medicamento[]> => {
  const query = `query ObtenerMedicamentosPapelera($usuario_id: ID!) { obtenerMedicamentosPapelera(usuario_id: $usuario_id) { _id nombre_farmaco dosis frecuencia_horas horarios_especificos fecha_eliminacion } }`;
  try {
    const response = await apiClient.post('', { query, variables: { usuario_id } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.obtenerMedicamentosPapelera || [];
  } catch (error) { handleGraphQLError(error); return []; }
};

export const crearMedicamento = async (input: any): Promise<Medicamento> => {
  const mutation = `mutation CrearMedicamento($input: CreateMedicamentoInput!) { crearMedicamento(createMedicamentoInput: $input) { _id } }`;
  try {
    const response = await apiClient.post('', { query: mutation, variables: { input } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.crearMedicamento;
  } catch (error) { handleGraphQLError(error); throw error; }
};

export const actualizarMedicamento = async (input: any): Promise<Medicamento> => {
  const mutation = `mutation ActualizarMedicamento($input: UpdateMedicamentoInput!) { actualizarMedicamento(updateMedicamentoInput: $input) { _id } }`;
  try {
    const response = await apiClient.post('', { query: mutation, variables: { input } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.actualizarMedicamento;
  } catch (error) { handleGraphQLError(error); throw error; }
};

export const eliminarMedicamento = async (id: string): Promise<Medicamento> => {
  const mutation = `mutation EliminarMedicamento($id: ID!) { eliminarMedicamento(id: $id) { _id } }`;
  try {
    const response = await apiClient.post('', { query: mutation, variables: { id } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.eliminarMedicamento;
  } catch (error) { handleGraphQLError(error); throw error; }
};

export const restaurarMedicamento = async (id: string): Promise<Medicamento> => {
  const mutation = `mutation RestaurarMedicamento($id: ID!) { restaurarMedicamento(id: $id) { _id } }`;
  try {
    const response = await apiClient.post('', { query: mutation, variables: { id } });
    if (response.data.errors) throw new Error(response.data.errors[0].message);
    return response.data.data.restaurarMedicamento;
  } catch (error) { handleGraphQLError(error); throw error; }
};