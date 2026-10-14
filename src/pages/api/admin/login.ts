import type { APIRoute } from 'astro';
import { getSupabaseConSesion } from '../../../lib/supabase/server';

export const prerender = false;

/**
 * Login del panel. La sesión se guarda en cookies httpOnly vía el cliente de
 * servidor, así que el middleware puede validar cada request.
 */
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const next = String(form.get('next') ?? '/admin');

  // Solo rutas internas: evita redirigir fuera del sitio con ?next=
  const destino = next.startsWith('/admin') ? next : '/admin';

  if (!email || !password) {
    return redirect(
      `/admin/login?error=credenciales&next=${encodeURIComponent(destino)}`,
    );
  }

  const supabase = getSupabaseConSesion(request, cookies);
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return redirect(
      `/admin/login?error=credenciales&next=${encodeURIComponent(destino)}`,
    );
  }

  return redirect(destino);
};