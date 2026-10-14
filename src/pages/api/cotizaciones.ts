import type { APIRoute } from 'astro';
import { getSupabaseAnon } from '../../lib/supabase/server';
import { MODO_DEMO } from '../../lib/content';
import { validarQuote } from '../../lib/validarQuote';

export const prerender = false;

/**
 * Recibe una cotización del formulario público.
 * Inserta con la ANON key: la RLS solo permite insertar y nunca leer, así que
 * nadie puede ver las solicitudes ajenas.
 */
export const POST: APIRoute = async ({ request }) => {
  // Sin proyecto de Supabase configurado no hay dónde guardar la solicitud.
  if (MODO_DEMO) {
    return json(
      {
        ok: false,
        error:
          'El formulario está en modo demostración. Configurá Supabase en el .env para recibir solicitudes.',
      },
      503,
    );
  }

  let cuerpo: unknown;

  try {
    cuerpo = await request.json();
  } catch {
    return json({ ok: false, error: 'Datos inválidos.' }, 400);
  }

  const validacion = validarQuote(cuerpo);

  if (!validacion.ok || !validacion.datos) {
    return json(
      {
        ok: false,
        error: 'Revisá los campos marcados.',
        errores: validacion.errores,
      },
      400,
    );
  }

  const q = validacion.datos;

  // Solo los campos que se guardan: id y created_at los pone la base.
  const datos = {
    nombre: q.nombre,
    telefono: q.telefono,
    comuna: q.comuna,
    tipo_mueble: q.tipo_mueble,
    servicio: q.servicio,
    medidas: q.medidas,
    descripcion: q.descripcion,
    fotos: q.fotos,
    estado: 'nueva' as const,
  };

  const supabase = getSupabaseAnon();
  const { data, error } = await supabase
    .from('quotes')
    .insert(datos)
    .select('id')
    .single();

  if (error) {
    console.error('[api/cotizaciones]', error.message);
    return json(
      {
        ok: false,
        error:
          'No pudimos registrar la solicitud. Escribinos por WhatsApp y lo vemos.',
      },
      500,
    );
  }

  return json({ ok: true, id: data?.id ?? null }, 201);
};

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}