import type { APIRoute } from 'astro';
import {
  adminContext,
  actualizarServicio,
  borrarServicio,
  numeroONull,
  textoONull,
} from '../../../../lib/admin';
import { getCurrentUser } from '../../../../lib/supabase/server';

export const prerender = false;

const id = (context: { params: Record<string, string | undefined> }) =>
  context.params.id ?? '';

export const PATCH: APIRoute = async ({ request, cookies, params }) => {
  const usuario = await getCurrentUser(request, cookies);
  if (!usuario) return Response.json({ error: 'Sesión vencida' }, { status: 401 });

  const cuerpo = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!cuerpo) return Response.json({ error: 'Datos inválidos' }, { status: 400 });

  const cambios: Record<string, unknown> = {};

  if ('nombre' in cuerpo) {
    const nombre = String(cuerpo.nombre ?? '').trim();
    if (!nombre) return Response.json({ error: 'El nombre no puede quedar vacío.' }, { status: 400 });
    cambios.nombre = nombre;
  }

  if ('descripcion' in cuerpo) cambios.descripcion = textoONull(cuerpo.descripcion ?? null);
  if ('precio_min' in cuerpo) cambios.precio_min = numeroONull(cuerpo.precio_min ?? null);
  if ('precio_max' in cuerpo) cambios.precio_max = numeroONull(cuerpo.precio_max ?? null);
  if ('icono' in cuerpo) cambios.icono = textoONull(cuerpo.icono ?? null);
  if ('orden' in cuerpo) cambios.orden = numeroONull(cuerpo.orden ?? null) ?? 0;

  if ('activo' in cuerpo) {
    cambios.activo = cuerpo.activo === true;
  }

  if (Object.keys(cambios).length === 0) {
    return Response.json({ error: 'No hay cambios.' }, { status: 400 });
  }

  try {
    const ctx = adminContext(request, cookies);
    const servicio = await actualizarServicio(ctx, id({ params }), cambios);
    return Response.json({ servicio });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : 'No se pudo guardar.';
    return Response.json({ error: mensaje }, { status: 400 });
  }
};

export const DELETE: APIRoute = async ({ request, cookies, params }) => {
  const usuario = await getCurrentUser(request, cookies);
  if (!usuario) return Response.json({ error: 'Sesión vencida' }, { status: 401 });

  try {
    const ctx = adminContext(request, cookies);
    await borrarServicio(ctx, id({ params }));
    return Response.json({ ok: true });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : 'No se pudo eliminar.';
    return Response.json({ error: mensaje }, { status: 400 });
  }
};