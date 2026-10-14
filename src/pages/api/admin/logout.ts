import type { APIRoute } from 'astro';
import { getSupabaseConSesion } from '../../../lib/supabase/server';

export const prerender = false;

/** Cierra la sesión del panel */
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = getSupabaseConSesion(request, cookies);
  await supabase.auth.signOut();
  return redirect('/admin/login');
};