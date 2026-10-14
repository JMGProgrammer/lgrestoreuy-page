/**
 * Datos del panel. Todo pasa por la sesión del admin: la RLS permite escribir
 * solo si is_admin() da true, así que no hace falta ninguna clave extra.
 */
import type { AstroCookies } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConSesion } from './supabase/server';
import type {
  GalleryItem,
  Piece,
  Quote,
  Service,
  SiteSettings,
  EstadoPieza,
  EstadoQuote,
} from './types';

export interface AdminContext {
  supabase: SupabaseClient;
}

export function adminContext(
  request: Request,
  cookies: AstroCookies,
): AdminContext {
  return { supabase: getSupabaseConSesion(request, cookies) };
}

/** slug en formato URL: sin tildes, con guiones */
export function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita los acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Acepta cualquier valor: llega de FormData o de un JSON del panel. */
export function numeroONull(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const limpio = String(valor).replace(/[^\d]/g, '');
  if (!limpio) return null;
  const n = Number.parseInt(limpio, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function textoONull(valor: unknown, max = 2000): string | null {
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio.slice(0, max) : null;
}

// ---------------------------------------------------------------- servicios

export async function listarServicios({ supabase }: AdminContext) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('orden', { ascending: true })
    .order('nombre', { ascending: true });

  if (error) throw new Error(`servicios: ${error.message}`);
  return (data ?? []) as Service[];
}

export interface ServicioInput {
  nombre: string;
  slug?: string;
  descripcion: string | null;
  precio_min: number | null;
  precio_max: number | null;
  icono: string | null;
  orden: number;
  activo: boolean;
}

export async function crearServicio(ctx: AdminContext, input: ServicioInput) {
  const slug =
    input.slug?.trim() || slugify(input.nombre) || `servicio-${Date.now()}`;

  const { data, error } = await ctx.supabase
    .from('services')
    .insert({ ...input, slug })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Service;
}

export async function actualizarServicio(
  ctx: AdminContext,
  id: string,
  input: Partial<ServicioInput> & { slug?: string },
) {
  const { data, error } = await ctx.supabase
    .from('services')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Service;
}

export async function borrarServicio(ctx: AdminContext, id: string) {
  const { error } = await ctx.supabase.from('services').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ----------------------------------------------------------------- contenido

export async function leerContenido({
  supabase,
}: AdminContext): Promise<SiteSettings> {
  const { data } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  return (data as SiteSettings | null) ?? {
    id: 1,
    nombre_taller: 'L&G Restore',
    whatsapp: null,
    email: null,
    direccion: null,
    horarios: null,
    mapa_url: null,
    instagram: null,
    facebook: null,
    texto_nosotros: null,
    texto_proceso: null,
    texto_garantia: null,
    texto_legal: null,
    updated_at: '',
  };
}

const CAMPOS_CONTENIDO = [
  'nombre_taller',
  'whatsapp',
  'email',
  'direccion',
  'horarios',
  'mapa_url',
  'instagram',
  'facebook',
  'texto_nosotros',
  'texto_proceso',
  'texto_garantia',
  'texto_legal',
] as const;

export async function guardarContenido(
  ctx: AdminContext,
  valores: Partial<Record<(typeof CAMPOS_CONTENIDO)[number], string | null>>,
) {
  const { data, error } = await ctx.supabase
    .from('site_settings')
    .upsert({ id: 1, ...valores })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as SiteSettings;
}

/** El WhatsApp se guarda solo con dígitos: 598 901 234 56 → 59890123456 */
export function limpiarTelefono(valor: string | null): string | null {
  if (!valor) return null;
  const digitos = valor.replace(/\D/g, '');
  return digitos.length >= 8 && digitos.length <= 15 ? digitos : null;
}

// ------------------------------------------------------------------- resumen

export interface Resumen {
  piezasDisponibles: number;
  piezasEnProceso: number;
  valorStock: number;
  serviciosActivos: number;
  serviciosSinPrecio: number;
  cotizacionesNuevas: number;
}

export async function resumen(ctx: AdminContext): Promise<Resumen> {
  const { supabase } = ctx;

  const [piezas, servicios, cotizaciones] = await Promise.all([
    supabase
      .from('pieces')
      .select('precio,estado')
      .in('estado', ['disponible', 'por_restaurar', 'en_restauracion']),
    supabase.from('services').select('activo,precio_min,precio_max'),
    supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('estado', 'nueva'),
  ]);

  const listaPiezas = (piezas.data ?? []) as Pick<Piece, 'precio' | 'estado'>[];
  const listaServicios = (servicios.data ?? []) as Pick<
    Service,
    'activo' | 'precio_min' | 'precio_max'
  >[];

  return {
    piezasDisponibles: listaPiezas.filter((p) => p.estado === 'disponible')
      .length,
    piezasEnProceso: listaPiezas.filter((p) => p.estado !== 'disponible').length,
    valorStock: listaPiezas
      .filter((p) => p.estado === 'disponible')
      .reduce((suma, p) => suma + (p.precio ?? 0), 0),
    serviciosActivos: listaServicios.filter((s) => s.activo).length,
    serviciosSinPrecio: listaServicios.filter(
      (s) => s.activo && (s.precio_min === null || s.precio_max === null),
    ).length,
    cotizacionesNuevas: cotizaciones.count ?? 0,
  };
}

// ------------------------------------------------------- piezas y cotizaciones

export async function listarPiezas(ctx: AdminContext): Promise<Piece[]> {
  const { data, error } = await ctx.supabase
    .from('pieces')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`piezas: ${error.message}`);
  return (data ?? []) as Piece[];
}

export async function listarCotizaciones(
  ctx: AdminContext,
  limite = 50,
): Promise<Quote[]> {
  const { data, error } = await ctx.supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limite);

  if (error) throw new Error(`cotizaciones: ${error.message}`);
  return (data ?? []) as Quote[];
}

export async function listarGaleria(ctx: AdminContext): Promise<GalleryItem[]> {
  const { data, error } = await ctx.supabase
    .from('gallery_items')
    .select('*')
    .order('orden', { ascending: true });

  if (error) throw new Error(`galería: ${error.message}`);
  return (data ?? []) as GalleryItem[];
}

// ------------------------------------------------------------------- imágenes

/** Solo formatos de imagen. Nada de .php, .html ni executables. */
const TIPOS_PERMITIDOS = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export interface SubidaImagen {
  storage_path: string;
  url: string;
}

/**
 * Sube una imagen al bucket indicado. Valida tipo y tamaño en el servidor:
 * el bucket es público, así que no queremos que pase nada raro.
 */
export async function subirImagen(
  ctx: AdminContext,
  bucket: string,
  archivo: File,
  prefijo: string,
): Promise<SubidaImagen> {
  if (!TIPOS_PERMITIDOS.has(archivo.type)) {
    throw new Error('Solo se aceptan imágenes JPG, PNG, WebP o GIF.');
  }

  if (archivo.size > MAX_BYTES) {
    throw new Error('La imagen supera los 8 MB.');
  }

  const extension = archivo.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const storagePath = `${prefijo}/${crypto.randomUUID()}.${extension}`;

  const { error } = await ctx.supabase.storage
    .from(bucket)
    .upload(storagePath, archivo, {
      cacheControl: '31536000',
      contentType: archivo.type,
      upsert: false,
    });

  if (error) throw new Error(`subida: ${error.message}`);

  const { data } = ctx.supabase.storage.from(bucket).getPublicUrl(storagePath);
  return { storage_path: storagePath, url: data.publicUrl };
}

/**
 * Link firmado para ver una foto de cotización (bucket privado).
 * Expira en una hora: alcanza para mirarla, no sirve para compartirla.
 */
export async function urlFirmada(
  ctx: AdminContext,
  storagePath: string,
  segundos = 3600,
): Promise<string | null> {
  const { data, error } = await ctx.supabase.storage
    .from('cotizaciones')
    .createSignedUrl(storagePath, segundos);

  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function listarFotosPieza(
  ctx: AdminContext,
  pieceId: string,
) {
  const { data, error } = await ctx.supabase
    .from('piece_photos')
    .select('*')
    .eq('piece_id', pieceId)
    .order('orden', { ascending: true });

  if (error) throw new Error(`fotos: ${error.message}`);
  return data ?? [];
}

export async function agregarFotoPieza(
  ctx: AdminContext,
  pieceId: string,
  subida: SubidaImagen,
  rol: 'general' | 'antes' | 'despues',
  orden: number,
) {
  const { error } = await ctx.supabase.from('piece_photos').insert({
    piece_id: pieceId,
    storage_path: subida.storage_path,
    url: subida.url,
    rol,
    orden,
  });

  if (error) throw new Error(error.message);
}

export async function borrarFotoPieza(ctx: AdminContext, id: string) {
  const { error } = await ctx.supabase.from('piece_photos').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export const ESTADOS_PIEZA: { valor: EstadoPieza; etiqueta: string }[] = [
  { valor: 'por_restaurar', etiqueta: 'Por restaurar' },
  { valor: 'en_restauracion', etiqueta: 'En restauración' },
  { valor: 'disponible', etiqueta: 'Disponible (se ve en la web)' },
  { valor: 'reservada', etiqueta: 'Reservada' },
  { valor: 'vendida', etiqueta: 'Vendida' },
  { valor: 'pausada', etiqueta: 'Pausada' },
  { valor: 'borrador', etiqueta: 'Borrador' },
];

export const ESTADOS_QUOTE: { valor: EstadoQuote; etiqueta: string }[] = [
  { valor: 'nueva', etiqueta: 'Nueva' },
  { valor: 'cotizada', etiqueta: 'Ya la cotizamos' },
  { valor: 'aceptada', etiqueta: 'Aceptada' },
  { valor: 'en_taller', etiqueta: 'En el taller' },
  { valor: 'lista', etiqueta: 'Lista' },
  { valor: 'entregada', etiqueta: 'Entregada' },
  { valor: 'rechazada', etiqueta: 'Rechazada' },
];

/** Estados de pieza que el formulario del panel puede enviar. */
export const ESTADOS_VALIDOS_PIEZA: EstadoPieza[] = [
  'por_restaurar',
  'en_restauracion',
  'disponible',
  'reservada',
  'vendida',
  'pausada',
  'borrador',
];