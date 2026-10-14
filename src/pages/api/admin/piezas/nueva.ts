import type { APIRoute } from 'astro';
import {
  adminContext,
  slugify,
  subirImagen,
  agregarFotoPieza,
} from '../../../../lib/admin';
import { getCurrentUser } from '../../../../lib/supabase/server';

export const prerender = false;

/**
 * Alta de pieza con fotos. El chequeo de sesión se repite acá: el middleware
 * ya cubre la ruta, pero una API que escribe datos no se apoya solo en eso.
 */
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const usuario = await getCurrentUser(request, cookies);
  if (!usuario) return redirect('/admin/login');

  const ctx = adminContext(request, cookies);
  const form = await request.formData();

  const titulo = String(form.get('titulo') ?? '').trim();
  const precio = Number.parseInt(
    String(form.get('precio') ?? '').replace(/[^\d]/g, ''),
    10,
  );

  if (!titulo) {
    return redirect('/admin/piezas/nueva?error=Falta+el+título');
  }

  if (!Number.isFinite(precio) || precio <= 0) {
    return redirect('/admin/piezas/nueva?error=Revisá+el+precio');
  }

  const slugBase = slugify(titulo) || `pieza-${Date.now()}`;
  const slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;

  const { data, error } = await ctx.supabase
    .from('pieces')
    .insert({
      titulo,
      slug,
      descripcion: (String(form.get('descripcion') ?? '').trim() || null),
      categoria: (String(form.get('categoria') ?? '').trim() || null),
      precio,
      costo_compra: (() => {
        const n = Number.parseInt(
          String(form.get('costo_compra') ?? '').replace(/[^\d]/g, ''),
          10,
        );
        return Number.isFinite(n) && n > 0 ? n : null;
      })(),
      medidas: (String(form.get('medidas') ?? '').trim() || null),
      ubicacion: (String(form.get('ubicacion') ?? '').trim() || null),
      estado: 'borrador',
      created_by: usuario.id,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[api/piezas]', error?.message);
    return redirect('/admin/piezas/nueva?error=No+se+pudo+crear+la+pieza');
  }

  // Fotos: best effort. Si alguna falla, la pieza ya quedó creada.
  const archivos = form
    .getAll('fotos')
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, 8);

  for (const [indice, archivo] of archivos.entries()) {
    try {
      const subida = await subirImagen(ctx, 'piezas', archivo, data.id);
      await agregarFotoPieza(ctx, data.id, subida, 'general', indice);
    } catch (e) {
      console.error('[api/piezas] foto:', e instanceof Error ? e.message : e);
    }
  }

  return redirect(`/admin/piezas/${data.id}`);
};