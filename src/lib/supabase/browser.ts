/**
 * Cliente de Supabase para el navegador.
 *
 * Se usa con la ANON key: toda la seguridad vive en las policies de RLS
 * (supabase/migrations/0001_init.sql). Nunca usamos service_role en el
 * cliente ni lo exponemos en el bundle.
 */
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = import.meta.env.PUBLIC_SUPABASE_URL;
    const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      throw new Error(
        'Faltan PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY en .env',
      );
    }

    client = createBrowserClient(url, anonKey);
  }

  return client;
}