/**
 * Clientes de Supabase.
 *
 * - `getSupabaseAnon()` para las páginas públicas: sin sesión, solo la ANON
 *   key. RLS decide qué se puede leer, así que no hace falta más.
 * - `getSupabaseConSesion()` para /admin: necesita leer y escribir las cookies
 *   de sesión del usuario para que RLS lo reconozca como admin.
 *
 * En ningún caso se usa `service_role`.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

function credenciales(): { url: string; anonKey: string } {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Faltan PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY en .env',
    );
  }

  return { url, anonKey };
}

/** Cliente anónimo para lecturas públicas. Sin sesión persistida. */
export function getSupabaseAnon(): SupabaseClient {
  const { url, anonKey } = credenciales();

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/** Convierte el header Cookie plano en la lista que espera @supabase/ssr */
function parseCookies(header: string | null): { name: string; value: string }[] {
  if (!header) return [];

  return header.split(';').flatMap((part) => {
    const index = part.indexOf('=');
    if (index < 0) return [];

    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    return name ? [{ name, value }] : [];
  });
}

/** Cliente con sesión, para el panel admin */
export function getSupabaseConSesion(
  request: Request,
  cookies: AstroCookies,
): SupabaseClient {
  const { url, anonKey } = credenciales();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => parseCookies(request.headers.get('cookie')),
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          try {
            cookies.set(name, value, options);
          } catch {
            // Si la respuesta ya empezó a salir, la sesión se refresca
            // igual desde el cliente.
          }
        }
      },
    },
  });
}

/** Usuario del panel autenticado, o null */
export async function getCurrentUser(
  request: Request,
  cookies: AstroCookies,
): Promise<{ id: string; email: string } | null> {
  const supabase = getSupabaseConSesion(request, cookies);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? { id: user.id, email: user.email ?? '' } : null;
}