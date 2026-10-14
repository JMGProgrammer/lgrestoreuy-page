/**
 * Acceso a datos de las páginas públicas.
 *
 * Todas las lecturas van con la ANON key y respetan RLS, así que lo que sale
 * de acá ya viene filtrado: solo piezas `disponible`, servicios `activo`.
 *
 * Las páginas se renderizan on-demand (no prerender) para que lo que carga el
 * cliente en /admin se vea al instante. Ver README.md, "Decisiones técnicas".
 *
 * Sin claves de Supabase configuradas se devuelven datos de demostración, para
 * poder revisar el diseño antes de tener la base de datos.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DEMO_GALLERY, DEMO_SERVICES } from './demo';
import type {
  GalleryItem,
  PiecePhoto,
  PieceWithPhotos,
  Service,
  SiteSettings,
} from './types';

/** ¿Estamos sin configurar? Entonces se muestran los datos de demostración. */
export const MODO_DEMO =
  !import.meta.env.PUBLIC_SUPABASE_URL || !import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

let anon: SupabaseClient | null = null;

function cliente(): SupabaseClient | null {
  if (MODO_DEMO) return null;

  if (!anon) {
    anon = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  return anon;
}

/** Si la fila de site_settings todavía no existe, la web igual renderiza */
export const SETTINGS_FALLBACK: SiteSettings = {
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

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = cliente();
  if (!supabase) return SETTINGS_FALLBACK;

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('[content] no se pudo leer site_settings:', error.message);
    return SETTINGS_FALLBACK;
  }

  return (data as SiteSettings | null) ?? SETTINGS_FALLBACK;
}

export async function getServices(
  options: { includeInactive?: boolean } = {},
): Promise<Service[]> {
  const supabase = cliente();

  if (!supabase) {
    return options.includeInactive
      ? DEMO_SERVICES
      : DEMO_SERVICES.filter((s) => s.activo);
  }

  let query = supabase
    .from('services')
    .select('*')
    .order('orden', { ascending: true })
    .order('nombre', { ascending: true });

  if (!options.includeInactive) query = query.eq('activo', true);

  const { data, error } = await query;

  if (error) {
    console.error('[content] no se pudieron leer los servicios:', error.message);
    return [];
  }

  return (data ?? []) as Service[];
}

export interface PiecesQuery {
  limit?: number;
  categoria?: string;
  soloDestacadas?: boolean;
}

export async function getPieces(
  options: PiecesQuery = {},
): Promise<PieceWithPhotos[]> {
  const supabase = cliente();
  if (!supabase) return [];

  let query = supabase
    .from('pieces')
    .select('*, fotos:piece_photos(*)')
    .eq('estado', 'disponible')
    .order('destacada', { ascending: false })
    .order('created_at', { ascending: false });

  if (options.categoria) query = query.eq('categoria', options.categoria);
  if (options.soloDestacadas) query = query.eq('destacada', true);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;

  if (error) {
    console.error('[content] no se pudieron leer las piezas:', error.message);
    return [];
  }

  return ((data ?? []) as unknown as PieceWithPhotos[]).map(sortFotos);
}

export async function getPieceBySlug(
  slug: string,
): Promise<PieceWithPhotos | null> {
  const supabase = cliente();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('pieces')
    .select('*, fotos:piece_photos(*)')
    .eq('slug', slug)
    .eq('estado', 'disponible')
    .maybeSingle();

  if (error) {
    console.error('[content] no se pudo leer la pieza:', error.message);
    return null;
  }

  return data ? sortFotos(data as unknown as PieceWithPhotos) : null;
}

export async function getGalleryHighlights(
  limit = 6,
): Promise<GalleryItem[]> {
  const supabase = cliente();
  if (!supabase) return DEMO_GALLERY.slice(0, limit);

  const { data, error } = await supabase
    .from('gallery_items')
    .select('*')
    .eq('destacada_home', true)
    .order('orden', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[content] no se pudo leer la galería:', error.message);
    return [];
  }

  return (data ?? []) as GalleryItem[];
}

/** Categorías con piezas disponibles, para el filtro de /piezas */
export async function getCategorias(): Promise<string[]> {
  const supabase = cliente();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('pieces')
    .select('categoria')
    .eq('estado', 'disponible')
    .not('categoria', 'is', null);

  if (error) {
    console.error('[content] no se pudieron leer las categorías:', error.message);
    return [];
  }

  const unique = new Set(
    (data as { categoria: string | null }[])
      .map((row) => row.categoria)
      .filter((value): value is string => Boolean(value)),
  );

  return [...unique].sort((a, b) => a.localeCompare(b, 'es'));
}

function sortFotos(piece: PieceWithPhotos): PieceWithPhotos {
  return {
    ...piece,
    fotos: [...(piece.fotos ?? [])].sort(
      (a: PiecePhoto, b: PiecePhoto) => a.orden - b.orden,
    ),
  };
}