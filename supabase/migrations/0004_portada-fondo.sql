-- 0004_portada-fondo.sql — LG Restore Uy
--
-- Foto de fondo del hero, blureada.
--
-- Por qué va en la base y no como archivo suelto en public/: el resto del
-- contenido del sitio lo carga el cliente desde /admin. Una foto en
-- /public/plantilla.jpg sería contenido de relleno que el cliente no puede
-- cambiar y que además queda desactualizada el día que有这么 una foto real
-- del taller. Con esto, sube su foto desde /admin → Contenido y es suya.
--
-- Como la web es SSR, leerla no cuesta una request extra: ya se pide
-- site_settings en cada render.
--
-- Se agrega, no se reescribe: las migraciones ya aplicadas no se tocan.

begin;

-- Foto de fondo y texto alternativo
alter table public.site_settings
  add column if not exists portada_url text;

alter table public.site_settings
  add column if not exists portada_alt text;

-- Bucket propio. Mismas reglas que piezas/galeria: lectura pública
-- (el fondo se carga desde el navegador sin sesión) y escritura solo admin.
insert into storage.buckets (id, name, public)
values ('portada', 'portada', true)
on conflict (id) do nothing;

-- La policy de lectura de 0001 tiene la lista de buckets escrita de forma
-- explícita, así que hay que rehacerla para sumar 'portada'.
drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects
  for select using (bucket_id in ('piezas', 'galeria', 'servicios', 'portada'));

commit;