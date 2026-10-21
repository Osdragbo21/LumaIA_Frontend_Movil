// [MÓVIL] Ruta: src/services/usuarios.service.ts

import axios from 'axios';
import { apiClient } from '../config/api.client';
import { Usuario } from '../types';

const handleGraphQLError = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.data?.errors) {
    throw new Error(error.response.data.errors[0].message);
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error('Ocurrió un error inesperado al conectar con el servidor.');
};

export const obtenerPerfilUsuario = async (usuario_id: string): Promise<Usuario> => {
  if (!usuario_id) throw new Error("Sesión inactiva.");

  const query = `
    query ObtenerUsuario($usuario_id: ID!) {
      obtenerUsuario(usuario_id: $usuario_id) {
        _id
        nombre
        correo
        rol
        cuidador_vinculado_id
        contactos_emergencia {
          nombre_contacto
          telefono
          parentesco
        }
      }
    }
  `;

  try {
    const response = await apiClient.post('', {
      query,
      variables: { usuario_id },
    });

    if (response.data.errors?.length > 0) {
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data.obtenerUsuario;
  } catch (error) {
    handleGraphQLError(error);
    throw error;
  }
};