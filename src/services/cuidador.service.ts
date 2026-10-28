// [MÓVIL] Ruta: src/services/cuidador.service.ts

import axios from 'axios';
import { apiClient } from '../config/api.client';
import { Usuario, Medicamento, Cita, RegistroToma } from '../types';

export interface ResumenAdultoVinculado {
  adulto: Usuario;
  medicamentos: Medicamento[];
  citas_hoy: Cita[];
  tomas_hoy: RegistroToma[];
}

const handleGraphQLError = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.data?.errors) {
    throw new Error(error.response.data.errors[0].message);
  }
  throw new Error('Ocurrió un error inesperado al conectar con el servidor.');
};

export const vincularAdultoMayor = async (cuidador_id: string, correo_adulto: string): Promise<Usuario> => {
  const mutation = `
    mutation VincularAdultoMayor($cuidador_id: ID!, $correo_adulto: String!) {
      vincularAdultoMayor(cuidador_id: $cuidador_id, correo_adulto: $correo_adulto) {
        _id
        nombre
        correo
      }
    }
  `;
  try {
    const response = await apiClient.post('', { query: mutation, variables: { cuidador_id, correo_adulto } });
    if (response.data.errors?.length > 0) throw new Error(response.data.errors[0].message);
    return response.data.data.vincularAdultoMayor;
  } catch (error) {
    handleGraphQLError(error);
    throw error;
  }
};

export const obtenerAdultosVinculados = async (cuidador_id: string): Promise<ResumenAdultoVinculado[]> => {
  const query = `
    query ObtenerAdultosVinculados($cuidador_id: ID!) {
      obtenerAdultosVinculados(cuidador_id: $cuidador_id) {
        adulto {
          _id
          nombre
          correo
          contactos_emergencia { telefono }
        }
        medicamentos { _id nombre_farmaco frecuencia_horas }
        citas_hoy { _id titulo_evento fecha_hora ubicacion }
        tomas_hoy { _id medicamento_id }
      }
    }
  `;
  try {
    const response = await apiClient.post('', { query, variables: { cuidador_id } });
    if (response.data.errors?.length > 0) throw new Error(response.data.errors[0].message);
    return response.data.data.obtenerAdultosVinculados || [];
  } catch (error) {
    handleGraphQLError(error);
    return [];
  }
};