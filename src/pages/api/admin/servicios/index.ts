import type { APIRoute } from 'astro';
import { adminContext, crearServicio, numeroONull, textoONull } from '../../../../lib/admin';
import { getCurrentUser } from '../../../../lib/supabase/server';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const usuario = await getCurrentUser(request, cookies);
  if (!usuario) return Response.json({ error: 'Sesión vencida' }, { status: 401 });

  const cuerpo = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  const nombre = String(cuerpo?.nombre ?? '').trim();
  if (!nombre) {
    return Response.json({ error: 'Falta el nombre del servicio.' }, { status: 400 });
  }

  try {
    const ctx = adminContext(request, cookies);
    const servicio = await crearServicio(ctx, {
      nombre,
      descripcion: textoONull(cuerpo?.descripcion ?? null),
      precio_min: numeroONull(cuerpo?.precio_min ?? null),
      precio_max: numeroONull(cuerpo?.precio_max ?? null),
      icono: textoONull(cuerpo?.icono ?? null),
      orden: numeroONull(cuerpo?.orden ?? null) ?? 0,
      activo: cuerpo?.activo !== false,
    });

    return Response.json({ servicio }, { status: 201 });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : 'No se pudo crear.';
    return Response.json({ error: mensaje }, { status: 400 });
  }
};

/** Reordenar: el panel manda el listado completo de ids ya en orden. */
export const PATCH: APIRoute = async ({ request, cookies }) => {
  const usuario = await getCurrentUser(request, cookies);
  if (!usuario) return Response.json({ error: 'Sesión vencida' }, { status: 401 });

  const cuerpo = (await request.json().catch(() => null)) as {
    ordenes?: unknown;
  } | null;

  if (!Array.isArray(cuerpo?.ordenes) || cuerpo.ordenes.length === 0) {
    return Response.json({ error: 'No se recibió el orden.' }, { status: 400 });
  }

  try {
    const { supabase } = adminContext(request, cookies);

    for (const [indice, idServicio] of (cuerpo.ordenes as string[]).entries()) {
      const { error } = await supabase
        .from('services')
        .update({ orden: indice })
        .eq('id', idServicio);

      if (error) throw new Error(error.message);
    }

    return Response.json({ ok: true });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : 'No se pudo ordenar.';
    return Response.json({ error: mensaje }, { status: 400 });
  }
};