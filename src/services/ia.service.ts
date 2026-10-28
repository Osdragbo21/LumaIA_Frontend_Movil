// [MÓVIL] Ruta: src/services/ia.service.ts

import axios from 'axios';
import { apiClient } from '../config/api.client';

export interface ConsultarAsistenteInput {
  usuario_id: string;
  pregunta_id: string;
  modelo?: string; 
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
    mutation ConsultarAsistente($usuario_id: ID!, $pregunta_id: String!, $modelo: String) {
      consultarAsistente(usuario_id: $usuario_id, pregunta_id: $pregunta_id, modelo: $modelo) {
        respuesta_texto
        intencion
      }
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

    // Retornamos solo el texto para la UI del chat
    return response.data.data.consultarAsistente.respuesta_texto;
  } catch (error) {
    handleGraphQLError(error);
    throw error;
  }
};

// NUEVO: Servicio para enviar el audio a transcribir
export const transcribirAudioIA = async (base64Audio: string): Promise<string> => {
  const mutation = `
    mutation TranscribirAudio($base64Audio: String!) {
      transcribirAudio(base64Audio: $base64Audio)
    }
  `;
  try {
    const response = await apiClient.post('', {
      query: mutation,
      variables: { base64Audio },
    });
    if (response.data.errors?.length > 0) throw new Error(response.data.errors[0].message);
    return response.data.data.transcribirAudio;
  } catch (error) {
    handleGraphQLError(error);
    throw error;
  }
};