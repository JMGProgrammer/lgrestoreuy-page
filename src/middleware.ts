import { defineMiddleware } from 'astro:middleware';
import { getSupabaseConSesion } from './lib/supabase/server';

/**
 * 1. /admin/* exige sesión de Supabase (salvo el login).
 * 2. Las páginas públicas se cachean en el CDN 60 s con revalidación en
 *    segundo plano: los cambios del panel se ven enseguida sin recargar
 *    todo desde cero en cada visita. El panel nunca se cachea.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAdmin = pathname.startsWith('/admin');
  const isLogin = pathname === '/admin/login';

  if (isAdmin && !isLogin) {
    // Sin variables de entorno no se puede validar la sesión: en desarrollo
    // se deja pasar y el error se ve en pantalla en vez de redirigir al login.
    const hayEnv =
      !!import.meta.env.PUBLIC_SUPABASE_URL &&
      !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    if (hayEnv) {
      const supabase = getSupabaseConSesion(context.request, context.cookies);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return context.redirect(
          `/admin/login?next=${encodeURIComponent(pathname)}`,
        );
      }
    }
  }

  const response = await next();

  response.headers.set(
    'Cache-Control',
    isAdmin
      ? 'no-store'
      : 'public, s-maxage=60, stale-while-revalidate=600',
  );

  return response;
});