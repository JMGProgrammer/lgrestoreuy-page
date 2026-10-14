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

  // El panel y sus APIs. Ojo: /api/admin NO empieza por /admin, así que
  // hay que cubrirlo explícitamente o quedaría sin protección.
  const esAdmin =
    pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const esLogin = pathname === '/admin/login';

  if (esAdmin && !esLogin) {
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
    esAdmin
      ? 'no-store'
      : 'public, s-maxage=60, stale-while-revalidate=600',
  );

  // Cabeceras de seguridad. apply: false en CSP porque se define abajo.
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Política de contenido: el sitio solo carga scripts del mismo origen,
  // estilos de Google Fonts (tipografías) e imágenes de Supabase.
  const imagenes = [
    "'self'",
    'data:',
    'blob:',
    'https://*.supabase.co',
    'https://*.supabase.in',
  ].join(' ');

  const connect = ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'].join(
    ' ',
  );

  /**
   * El panel necesita 'unsafe-eval': Alpine evalúa sus expresiones con
   * `new Function()`. Sin esto, cada directiva lanza EvalError y la pantalla
   * se queda sin comportamiento (por eso los botones "no sirven").
   *
   * La alternativa es el build `@alpinejs/csp`, que obliga a reescribir todas
   * las expresiones (sin llamadas inline en x-data, sin argumentos en los
   * handlers). Se acepta 'unsafe-eval' solo acá, que es una superficie de
   * ataque mucho menor que la web pública, y esa sigue sin eval.
   *
   * En desarrollo se suma 'unsafe-inline' porque la barra de herramientas de
   * Astro inyecta scripts en línea. En producción no existe.
   */
  const scripts = import.meta.env.DEV
    ? `'self' 'unsafe-inline'${esAdmin ? " 'unsafe-eval'" : ''}`
    : esAdmin
      ? "'self' 'unsafe-eval'"
      : "'self'";

  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `script-src ${scripts}`,
      // Tailwind inyecta estilos; los de Google Fonts necesitan su dominio.
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      'font-src https://fonts.gstatic.com',
      `img-src ${imagenes}`,
      `connect-src ${connect}`,
      "frame-src https://www.google.com https://maps.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
  );

  // El panel nunca debe quedar cacheado ni indexado.
  if (esAdmin) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
});