// [MÓVIL] Ruta: src/services/auth.service.ts

import axios from 'axios';
import { apiClient } from '../config/api.client';
import { Enum_Rol, Usuario } from '../types';

export interface LoginResponse {
  access_token: string;
  usuario_id: string;
  rol: Enum_Rol;
}

// Extractor de Errores GraphQL
const handleGraphQLError = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.data?.errors) {
    throw new Error(error.response.data.errors[0].message);
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error('Ocurrió un error inesperado');
};

const mapGraphQLRoleToEnum = (gqlRole: string): Enum_Rol => {
  if (gqlRole === 'ADULTO_MAYOR') return 'Adulto Mayor';
  if (gqlRole === 'CUIDADOR') return 'Cuidador';
  return 'Adulto Mayor'; 
};

export const mapEnumToGraphQLRole = (rol: Enum_Rol): string => {
  if (rol === 'Adulto Mayor') return 'ADULTO_MAYOR';
  if (rol === 'Cuidador') return 'CUIDADOR';
  return 'ADULTO_MAYOR';
};

export const loginUsuario = async (correo: string, password: string): Promise<LoginResponse> => {
  const query = `
    mutation Login($correo: String!, $password: String!) {
      login(correo: $correo, password: $password) {
        access_token
        usuario_id
        rol
      }
    }
  `;

  try {
    const response = await apiClient.post('', {
      query,
      variables: { correo, password },
    });

    if (response.data.errors?.length > 0) {
      throw new Error(response.data.errors[0].message);
    }

    const data = response.data.data.login;
    return {
      access_token: data.access_token,
      usuario_id: data.usuario_id,
      rol: mapGraphQLRoleToEnum(data.rol),
    };
  } catch (error) {
    handleGraphQLError(error);
    throw error;
  }
};

export const registrarUsuario = async (input: any): Promise<Usuario> => {
  const mutation = `
    mutation RegistrarUsuario($input: CreateUsuarioInput!) {
      registrarUsuario(input: $input) {
        _id
        nombre
        correo
        rol
        estado_activo
      }
    }
  `;

  try {
    const response = await apiClient.post('', {
      query: mutation,
      variables: { input },
    });

    if (response.data.errors?.length > 0) {
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data.registrarUsuario;
  } catch (error) {
    handleGraphQLError(error);
    throw error;
  }
};