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

  // El id se genera acá y NO se pide la fila de vuelta con .select().
  //
  // .select() después de .insert() le agrega a supabase-js un
  // "Prefer: return=representation", y eso hace que PostgREST lea la fila
  // recién insertada para devolverla. El anónimo no tiene permiso de
  // lectura sobre quotes (a propósito: nadie puede ver las solicitudes
  // ajenas), así que ese SELECT viola la RLS y la respuesta termina
  // diciendo "new row violates row-level security policy" — aunque el
  // INSERT sí se haya hecho. Por eso el pedido llegaba guardándose pero el
  // formulario le mostraba error al visitante.
  const id = crypto.randomUUID();

  const { error } = await supabase.from('quotes').insert({ id, ...datos });

  if (error) {
    console.error('[api/cotizaciones]', error.message, error.code);
    return json(
      {
        ok: false,
        error:
          'No pudimos registrar la solicitud. Escribinos por WhatsApp y lo vemos.',
      },
      500,
    );
  }

  return json({ ok: true, id }, 201);
};

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}