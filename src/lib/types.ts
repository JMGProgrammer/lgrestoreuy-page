/**
 * Tipos del modelo de datos. Reflejan supabase/migrations/0001_init.sql
 * Ver Docs/10-modelo-relacional.md
 */

export type RolAdmin = 'admin' | 'ayudante';

export type EstadoPieza =
  | 'por_restaurar'
  | 'en_restauracion'
  | 'disponible'
  | 'reservada'
  | 'vendida'
  | 'pausada'
  | 'borrador';

export type EstadoQuote =
  | 'nueva'
  | 'cotizada'
  | 'aceptada'
  | 'en_taller'
  | 'lista'
  | 'entregada'
  | 'rechazada';

export type RolFoto = 'general' | 'antes' | 'despues';

export interface Profile {
  id: string;
  email: string;
  role: RolAdmin;
  created_at: string;
}

export interface Service {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  precio_min: number | null;
  precio_max: number | null;
  icono: string | null;
  orden: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: 1;
  nombre_taller: string;
  whatsapp: string | null;
  email: string | null;
  direccion: string | null;
  horarios: string | null;
  mapa_url: string | null;
  instagram: string | null;
  facebook: string | null;
  texto_nosotros: string | null;
  texto_proceso: string | null;
  texto_garantia: string | null;
  texto_legal: string | null;
  updated_at: string;
}

export interface Piece {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  categoria: string | null;
  precio: number;
  costo_compra: number | null;
  estado: EstadoPieza;
  destacada: boolean;
  medidas: string | null;
  ubicacion: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PiecePhoto {
  id: string;
  piece_id: string;
  storage_path: string;
  url: string;
  rol: RolFoto;
  orden: number;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  titulo: string | null;
  antes_url: string;
  despues_url: string;
  tag_servicio: string | null;
  destacada_home: boolean;
  orden: number;
  created_by: string | null;
  created_at: string;
  /** 0003: de qué pieza sale el par */
  piece_id?: string | null;
  /** 0003: qué fotos de esa pieza se eligieron */
  antes_photo_id?: string | null;
  despues_photo_id?: string | null;
}

export interface Quote {
  id: string;
  nombre: string;
  telefono: string;
  comuna: string | null;
  tipo_mueble: string | null;
  servicio: string | null;
  medidas: string | null;
  descripcion: string | null;
  fotos: string[];
  estado: EstadoQuote;
  monto_cotizado: number | null;
  monto_abono: number | null;
  created_at: string;
}

/** Pieza con sus fotos, para las páginas públicas */
export interface PieceWithPhotos extends Piece {
  fotos: PiecePhoto[];
}