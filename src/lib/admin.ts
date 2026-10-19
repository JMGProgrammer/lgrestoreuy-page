/**
 * Datos del panel. Todo pasa por la sesión del admin: la RLS permite escribir
 * solo si is_admin() da true, así que no hace falta ninguna clave extra.
 */
import type { AstroCookies } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConSesion } from './supabase/server';
import type {
  Asset,
  TagAsset,
  GalleryItem,
  Piece,
  PiecePhoto,
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

/**
 * Traduce el error crudo de PostgREST/Supabase a algo que el cliente pueda
 * entender y, sobre todo, actuar.
 *
 * El caso que más aparece: `Could not find the 'x' column ... in the schema
 * cache`. No es un error del usuario ni un problema del formulario — es una
 * migración sin correr, y el mensaje original manda a cualquier persona a
 * revisar el código en vez de a aplicar el SQL.
 */
export function errorLegible(err: { message: string } | null): string | null {
  if (!err) return null;

  const msg = err.message;

  if (/could not find the .* column|schema cache/i.test(msg)) {
    const col = msg.match(/'([^']+)' column/)?.[1];
    return `La base de datos todavía no tiene la columna "${
      col ?? 'nueva'
    }". Es una migración pendiente, no un problema con lo que cargaste: avisame y la aplico.`;
  }

  if (/row-level security|violates row-level security policy/i.test(msg)) {
    return 'Tu sesión no tiene permiso para guardar esto. Volvé a iniciar sesión en el panel.';
  }

  if (/duplicate key|already exists/i.test(msg)) {
    return 'Ya existe un registro con esos datos.';
  }

  if (/invalid input syntax|invalid uuid/i.test(msg)) {
    return 'Alguno de los datos tiene un formato inválido.';
  }

  if (/bucket not found/i.test(msg)) {
    // Casi siempre es una migración sin correr, no un problema de la foto.
    const b = msg.match(/bucket[:\s]+([a-z0-9_-]+)/i)?.[1] ?? 'desconocido';
    return `La base todavía no tiene el lugar donde guardar esa imagen (el bucket "${b}"). Es una migración pendiente, no un problema con la foto: avisame y te digo cuál aplicar.`;
  }

  if (/connection|fetch failed|network|timeout/i.test(msg)) {
    return 'No se pudo conectar con la base de datos. Revisá la conexión y probá de nuevo.';
  }

  return msg;
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

// ----------------------------------------------------------------- cotizaciones

/**
 * Días que un pedido queda en la papelera antes de purgarse.
 *
 * Tres días alcanza para darse cuenta de que algo se borró de más y
 * recuperarlo. Está en una constante y no en la tabla a propósito: cambiarlo
 * es cambiar un número acá, y no una UPDATE sobre pedidos que ya están en la
 * papelera (que arrastraría el cambio hacia atrás sin avisar).
 */
export const DIAS_EN_PAPELERA = 3;

/** Copia el pedido a la papelera y lo saca de la lista. */
export async function moverAPapelera(ctx: AdminContext, id: string) {
  const { data, error } = await ctx.supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Ese pedido ya no está.');

  const { error: errorPapelera } = await ctx.supabase
    .from('quotes_borradas')
    .insert({
      ...data,
      borrada_at: new Date().toISOString(),
      se_borra_el: new Date(
        Date.now() + DIAS_EN_PAPELERA * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });

  if (errorPapelera) throw new Error(errorPapelera.message);

  // La fila solo se saca después de que la copia entró. Si el insert falla,
  // el pedido sigue en la lista y nada se perdió.
  const { error: errorBorrado } = await ctx.supabase
    .from('quotes')
    .delete()
    .eq('id', id);

  if (errorBorrado) throw new Error(errorBorrado.message);
}

export interface PapeleraItem extends Quote {
  borrada_at: string;
  se_borra_el: string;
}

/**
 * Purga lo que ya venció y devuelve lo que queda.
 *
 * El purgado corre desde acá y no desde un job de base por una razón
 * concreta: Storage tiene un trigger que no deja borrar desde SQL, así que
 * un job podría limpiar la fila pero dejaría las fotos huérfanas en el
 * bucket para siempre. Desde la web se borran las dos cosas juntas.
 */
export async function listarPapelera(ctx: AdminContext) {
  await purgarPapelera(ctx);

  const { data, error } = await ctx.supabase
    .from('quotes_borradas')
    .select('*')
    .order('borrada_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PapeleraItem[];
}

/** Borra para siempre lo que ya cumplió su plazo. Archivos incluidos. */
export async function purgarPapelera(ctx: AdminContext) {
  const { data: vencidas, error } = await ctx.supabase
    .from('quotes_borradas')
    .select('id, fotos')
    .lte('se_borra_el', new Date().toISOString());

  if (error) throw new Error(`papelera: ${error.message}`);
  if (!vencidas || vencidas.length === 0) return 0;

  const rutas = vencidas.flatMap((v) => (v.fotos as string[] | null) ?? []);

  if (rutas.length > 0) {
    const { error: errorStorage } = await ctx.supabase.storage
      .from('cotizaciones')
      .remove(rutas);

    // Si los archivos no se van, igual hay que sacar la fila: si no, el
    // purgado vuelve a intentar en cada visita y nunca termina.
    if (errorStorage) {
      console.warn('[papelera] no se pudieron borrar los archivos:', errorStorage.message);
    }
  }

  const { error: errorBorrado } = await ctx.supabase
    .from('quotes_borradas')
    .delete()
    .in('id', vencidas.map((v) => v.id));

  if (errorBorrado) throw new Error(`papelera: ${errorBorrado.message}`);

  return vencidas.length;
}

/** Devuelve un pedido de la papelera a la lista, con el mismo id. */
export async function restaurarDePapelera(ctx: AdminContext, id: string) {
  const { data, error } = await ctx.supabase
    .from('quotes_borradas')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Ese pedido ya no está en la papelera.');

  const { borrada_at, se_borra_el, ...pedido } = data;

  const { error: errorVuelta } = await ctx.supabase
    .from('quotes')
    .insert(pedido);

  if (errorVuelta) throw new Error(errorVuelta.message);

  const { error: errorFuera } = await ctx.supabase
    .from('quotes_borradas')
    .delete()
    .eq('id', id);

  if (errorFuera) throw new Error(errorFuera.message);
}

/**
 * Borrado definitivo desde la papelera. A diferencia de moverAPapelera, acá
 * sí se borran los archivos: no hay a dónde volver atrás.
 */
export async function borrarDePapelera(ctx: AdminContext, id: string) {
  const { data, error } = await ctx.supabase
    .from('quotes_borradas')
    .select('fotos')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const rutas = (data?.fotos as string[] | null) ?? [];
  if (rutas.length > 0) {
    await ctx.supabase.storage.from('cotizaciones').remove(rutas);
  }

  const { error: errorBorrado } = await ctx.supabase
    .from('quotes_borradas')
    .delete()
    .eq('id', id);

  if (errorBorrado) throw new Error(errorBorrado.message);
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
  portada_url: null,
  portada_alt: null,
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
  'portada_url',
  'portada_alt',
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

export interface PiezaConFotos extends Piece {
  fotos: PiecePhoto[];
}

/**
 * Piezas con sus fotos, para armar un par en la galería.
 * Solo las que tienen al menos una foto: un par no se puede armar sin fotos.
 */
export async function listarPiezasConFotos(
  ctx: AdminContext,
): Promise<PiezaConFotos[]> {
  const { data, error } = await ctx.supabase
    .from('pieces')
    .select('*, fotos:piece_photos(*)')
    .not('fotos', 'is', null)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`piezas: ${error.message}`);

  return ((data ?? []) as unknown as PiezaConFotos[]).map((pieza) => ({
    ...pieza,
    fotos: [...(pieza.fotos ?? [])].sort((a, b) => a.orden - b.orden),
  }));
}

export interface PiezaParaAnillo {
  pieza: PiezaConFotos;
  /** La foto que sale en el anillo: la portada (primera por orden). */
  foto: PiecePhoto;
}

/**
 * Todas las piezas con sus fotos — incluidas las que no tienen ninguna.
 * La galería la usa para el manager de fotos por pieza, para el anillo del
 * hero y para armar el par del comparador, así que un solo query alcanza.
 */
export async function listarPiezasConTodasLasFotos(
  ctx: AdminContext,
): Promise<PiezaConFotos[]> {
  const { data, error } = await ctx.supabase
    .from('pieces')
    .select('*, fotos:piece_photos(*)')
    .order('destacada', { ascending: false })
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`piezas: ${error.message}`);

  return ((data ?? []) as unknown as PiezaConFotos[]).map((pieza) => ({
    ...pieza,
    fotos: [...(pieza.fotos ?? [])].sort((a, b) => a.orden - b.orden),
  }));
}

/**
 * Los 8 slots del anillo del hero, mirados igual que la web los mira:
 * piezas marcadas con en_anillo (0006) y cae al de siempre (primeras con
 * foto) mientras nadie marcó. Cambiar acá es cambiar el orden de la web.
 */
export function armarAnillo(
  piezas: PiezaConFotos[],
  limite = 8,
): PiezaParaAnillo[] {
  const conFoto = piezas
    .filter((p) => p.fotos.length > 0)
    .map((pieza) => ({ pieza, foto: pieza.fotos[0] }));

  const marcadas = piezas.filter((p) => p.en_anillo);

  if (marcadas.length === 0) return conFoto.slice(0, limite);

  return marcadas
    .filter((p) => p.fotos.length > 0)
    .map((pieza) => ({ pieza, foto: pieza.fotos[0] }))
    .slice(0, limite);
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

/** Registra la foto en la pieza y devuelve la fila creada (con su id). */
export async function agregarFotoPieza(
  ctx: AdminContext,
  pieceId: string,
  subida: SubidaImagen,
  rol: 'general' | 'antes' | 'despues',
  orden: number,
) {
  const { data, error } = await ctx.supabase
    .from('piece_photos')
    .insert({
      piece_id: pieceId,
      storage_path: subida.storage_path,
      url: subida.url,
      rol,
      orden,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function borrarFotoPieza(ctx: AdminContext, id: string) {
  const { data: foto, error: errorLectura } = await ctx.supabase
    .from('piece_photos')
    .select('id, storage_path, url')
    .eq('id', id)
    .maybeSingle();

  if (errorLectura) throw new Error(`fotos: ${errorLectura.message}`);
  if (!foto) return;

  const { error } = await ctx.supabase.from('piece_photos').delete().eq('id', id);
  if (error) throw new Error(error.message);

  // El archivo de Storage se borra solo si nadie más lo está mostrando.
  // El comparador guarda una copia de la URL en cada par (0003): si un par
  // apunta a esta foto, el archivo tiene que seguir vivo o el par se
  // rompería en silencio. Consulta por id y por copia de URL, por si acaso.
  const [porAntes, porDespues, porUrl] = await Promise.all([
    ctx.supabase
      .from('gallery_items')
      .select('id', { count: 'exact', head: true })
      .eq('antes_photo_id', id),
    ctx.supabase
      .from('gallery_items')
      .select('id', { count: 'exact', head: true })
      .eq('despues_photo_id', id),
    ctx.supabase
      .from('gallery_items')
      .select('id', { count: 'exact', head: true })
      .or(`antes_url.eq.${foto.url},despues_url.eq.${foto.url}`),
  ]);

  const usada =
    (porAntes.count ?? 0) + (porDespues.count ?? 0) + (porUrl.count ?? 0) > 0;

  if (!usada && foto.storage_path) {
    // Best effort: la fila ya se fue, así que la web ya no muestra la foto.
    // Si Storage falla, el archivo caído es un problema de higiene menor.
    await ctx.supabase.storage.from('piezas').remove([foto.storage_path]);
  }
}

/**
 * Reordena una foto intercambiándola con la vecina de arriba o de abajo.
 * Reenumerar en bloque (y no solo hacer swap de dos `orden`) evita los
 * empates: dos fotos con el mismo `orden` se pelean por la posición.
 */
export async function moverFotoPieza(
  ctx: AdminContext,
  fotoId: string,
  direccion: 1 | -1,
) {
  const { data: foto } = await ctx.supabase
    .from('piece_photos')
    .select('piece_id')
    .eq('id', fotoId)
    .maybeSingle();

  if (!foto) return;

  const { data: lista } = await ctx.supabase
    .from('piece_photos')
    .select('id')
    .eq('piece_id', (foto as { piece_id: string }).piece_id)
    .order('orden', { ascending: true });

  const ids = (lista ?? []).map((f) => String((f as { id: string }).id));
  const desde = ids.indexOf(fotoId);
  const hasta = desde + (direccion > 0 ? 1 : -1);

  if (desde < 0 || hasta < 0 || hasta >= ids.length) return;

  ids.splice(desde, 1);
  ids.splice(hasta, 0, fotoId);

  await Promise.all(
    ids.map((id, indice) =>
      ctx.supabase.from('piece_photos').update({ orden: indice }).eq('id', id),
    ),
  );
}

// ------------------------------------------------------------------- assets

export async function listarAssets(ctx: AdminContext): Promise<Asset[]> {
  const { data, error } = await ctx.supabase
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`assets: ${error.message}`);
  return (data ?? []) as Asset[];
}

export interface AssetInput {
  archivo: File;
  tag: TagAsset;
  alt: string | null;
}

/** Sube el archivo al bucket y registra la fila: las dos cosas juntas. */
export async function crearAsset(ctx: AdminContext, input: AssetInput): Promise<Asset> {
  const subida = await subirImagen(ctx, 'assets', input.archivo, 'libreria');

  const { data, error } = await ctx.supabase
    .from('assets')
    .insert({
      storage_path: subida.storage_path,
      url: subida.url,
      tag: input.tag,
      alt: input.alt,
    })
    .select('*')
    .single();

  if (error) throw new Error(`assets: ${error.message}`);
  return data as Asset;
}

/**
 * Borrar un asset es borrar también el archivo (patrón papelera): sin eso
 * queda huérfano en Storage para siempre. Se niega si el asset es hoy el
 * fondo del hero: sacarlo rompería la home sin que el cliente se dé cuenta.
 */
export async function borrarAsset(
  ctx: AdminContext,
  id: string,
): Promise<'borrado' | 'en_uso'> {
  const { data: asset, error } = await ctx.supabase
    .from('assets')
    .select('storage_path, url')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`assets: ${error.message}`);
  if (!asset) return 'borrado';

  const { data: settings } = await ctx.supabase
    .from('site_settings')
    .select('portada_url')
    .eq('id', 1)
    .maybeSingle();

  if (settings?.portada_url && settings.portada_url === asset.url) {
    return 'en_uso';
  }

  await ctx.supabase.storage.from('assets').remove([asset.storage_path]);

  const { error: errorBorrado } = await ctx.supabase
    .from('assets')
    .delete()
    .eq('id', id);

  if (errorBorrado) throw new Error(`assets: ${errorBorrado.message}`);
  return 'borrado';
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