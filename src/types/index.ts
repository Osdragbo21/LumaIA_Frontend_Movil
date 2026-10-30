// [MÓVIL] Ruta: src/types/index.ts

export type Enum_Rol = 'Adulto Mayor' | 'Cuidador';
export type Enum_EstadoToma = 'PENDIENTE' | 'CONFIRMADA' | 'OMITIDA';
export type Enum_EstadoCita = 'PROGRAMADA' | 'COMPLETADA' | 'CANCELADA';

export interface ContactoEmergencia {
    nombre_contacto: string;
    telefono: string;
    parentesco: string;
}

export interface Usuario {
    _id: string;
    nombre: string;
    correo: string;
    rol: Enum_Rol;
    cuidador_vinculado_id?: string;
    pin_vinculacion?: string;
    estado_activo: boolean;
    tokens_dispositivo: string[];
    contactos_emergencia: ContactoEmergencia[];
}

export interface Medicamento {
    _id: string;
    usuario_id: string;
    nombre_farmaco: string;
    dosis: string;
    frecuencia_horas?: number;
    horarios_especificos: string[];
    fecha_eliminacion?: string;
}

export interface Cita {
    _id: string;
    usuario_id: string;
    titulo_evento: string;
    fecha_hora: string; 
    ubicacion?: string;
    estado: Enum_EstadoCita;
    fecha_eliminacion?: string;
}

export interface RegistroToma {
    _id: string;
    medicamento_id: string;
    fecha_programada: string; 
    estado_toma: Enum_EstadoToma;
    fecha_confirmacion?: string; 
}

export interface NotaPersonal {
    _id: string;
    usuario_id: string;
    contenido: string;
    fecha_creacion: string;
    fecha_eliminacion?: string;
}

export interface AdherenciaManhattan {
    fecha: string;
    retraso_minutos: number;
}

export interface IntencionEuclidiana {
    intencion: string;
    cantidad: number;
    distancia_promedio: number;
}

export interface SeguridadDFS {
    permitidas: number;
    bloqueadas: number;
}

export interface AnaliticaDashboard {
    adherencia: AdherenciaManhattan[];
    intenciones: IntencionEuclidiana[];
    seguridad_dfs: SeguridadDFS;
}

