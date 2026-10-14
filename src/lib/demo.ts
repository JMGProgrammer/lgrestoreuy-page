/**
 * Datos de demostración.
 *
 * Se usan SOLO cuando todavía no hay .env con las claves de Supabase, para
 * poder revisar el diseño y la estructura sin la base de datos.
 *
 * Solo servicios: son texto real que el cliente conserva. No hay fotos ni
 * ilustraciones de relleno, para no mostrar en la web trabajo que no existe.
 */
import type { Service } from './types';

export const DEMO_SERVICES: Service[] = [
  {
    id: 'demo-1',
    nombre: 'Reparación de estructura',
    slug: 'reparacion-estructura',
    descripcion:
      'Reconstrucción de la estructura: junturas, patas, travesaños y herrajes. Se evalúa cada pieza según el daño.',
    precio_min: null,
    precio_max: null,
    icono: 'hammer',
    orden: 1,
    activo: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'demo-2',
    nombre: 'Lustre y barnizado',
    slug: 'lustre-y-barnizado',
    descripcion:
      'Limpieza profunda, retiro de barniz viejo, lijado y aplicación de lustrado o barniz. Acabado mate, satinado o brillo.',
    precio_min: null,
    precio_max: null,
    icono: 'sparkles',
    orden: 2,
    activo: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'demo-3',
    nombre: 'Pintura y laqueado',
    slug: 'pintura-y-laqueado',
    descripcion:
      'Pintura en laca, esmalte o poliuretano sobre madera o metal. Incluye preparación de superficie y protección final.',
    precio_min: null,
    precio_max: null,
    icono: 'paintbrush',
    orden: 3,
    activo: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'demo-4',
    nombre: 'Restauración de antigüedades',
    slug: 'restauracion-antiguedades',
    descripcion:
      'Restauración de piezas de época: muebles, objetos y detalles. Trabajo de paciencia y terminación fina.',
    precio_min: null,
    precio_max: null,
    icono: 'clock',
    orden: 4,
    activo: true,
    created_at: '',
    updated_at: '',
  },
];