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
    // Antes todos los fallos volvían como "credenciales". Supabase devuelve
    // un mensaje distinto cuando el usuario existe pero el correo no está
    // confirmado, y esa es una causa muy común: el usuario se crea en el
    // panel de Supabase y no llega el correo de confirmación. Sin esto el
    // cliente ve "contraseña incorrecta" y busca el error en el lugar
    // equivocado.
    const motivo = /not confirmed/i.test(error.message)
      ? 'no-confirmado'
      : /invalid login credentials/i.test(error.message)
        ? 'credenciales'
        : 'generico';

    return redirect(
      `/admin/login?error=${motivo}&next=${encodeURIComponent(destino)}`,
    );
  }

  return redirect(destino);
};