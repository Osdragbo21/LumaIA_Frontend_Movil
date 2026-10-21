// [MÓVIL] Ruta: src/services/ia.service.ts

import axios from 'axios';
import { apiClient } from '../config/api.client';

export interface ConsultarAsistenteInput {
  usuario_id: string;
  pregunta_id: string;
}

const handleGraphQLError = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.data?.errors) {
    throw new Error(error.response.data.errors[0].message);
  }
  throw error;
};

export const consultarAsistente = async (input: ConsultarAsistenteInput): Promise<string> => {
  if (!input.usuario_id) throw new Error("Sesión inactiva.");

  const mutation = `
    mutation ConsultarAsistente($usuario_id: ID!, $pregunta_id: String!) {
      consultarAsistente(usuario_id: $usuario_id, pregunta_id: $pregunta_id)
    }
  `;

  try {
    const response = await apiClient.post('', {
      query: mutation,
      variables: input,
    });

    if (response.data.errors?.length > 0) {
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data.consultarAsistente;
  } catch (error) {
    handleGraphQLError(error);
    throw error;
  }
};