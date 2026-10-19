-- 0006_hero-anillo-assets.sql — LG Restore Uy
--
-- Anillo del hero bajo control + librería de assets (plan Docs/14).
--
-- Dos cosas en una migración porque salen juntas en el mismo deploy:
--
-- 1) pieces.en_anillo: hasta ahora el anillo 3D del home tomaba las primeras
--    8 piezas con foto y de cada una la foto de portada, sin que el cliente
--    elija nada. Con esta columna marca cuáles son; mientras la deje sin
--    marcar (default false en todas), el anillo cae al comportamiento de
--    hoy: no cambia nada hasta que él decide.
--
-- 2) assets: fotos sueltas que NO son piezas — ambiente del taller
--    (fondo del hero), texturas, personal, logo. La regla del proyecto dice
--    no relleno, así que la librería nace vacía y el cliente la llena.
--
-- Idempotente a propósito: puede correrse de nuevo sin romper nada.
-- Las migraciones ya aplicadas no se tocan (0001–0005 intactas).

begin;

-- ---------------------------------------------------------------------
-- 1. Anillo del hero: selección explícita de piezas
-- ---------------------------------------------------------------------
alter table public.pieces
  add column if not exists en_anillo boolean not null default false;

-- La escritura de piezas ya está cubierta por pieces_admin_write (0001):
-- el cliente marcará la casilla desde la pestaña Hero de la galería.

-- ---------------------------------------------------------------------
-- 2. Librería de assets
-- ---------------------------------------------------------------------
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  url text not null,
  alt text,
  tag text not null default 'otro'
    check (tag in ('ambiente', 'textura', 'personal', 'logo', 'otro')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.assets enable row level security;

-- Los assets se muestran en la web pública sin sesión: lectura abierta,
-- como piece_photos o site_settings. El filtro es el bucket, no la fila.
drop policy if exists assets_public_read on public.assets;
create policy assets_public_read on public.assets
  for select using (true);

-- Escribir solo desde el panel.
drop policy if exists assets_admin_write on public.assets;
create policy assets_admin_write on public.assets
  for all using (public.is_admin()) with check (public.is_admin());

-- Bucket. Misma regla que piezas/portada: público para leer, admin para
-- escribir. Los del plan: ambiente (fondo del hero), textura, personal
-- (taller/herramienta), logo.
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

-- La policy de lectura de 0001 (rehaceada en 0004) lista los buckets a mano,
-- así que para sumar 'assets' hay que rehacerla otra vez.
drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects
  for select using (bucket_id in ('piezas', 'galeria', 'servicios', 'portada', 'assets'));

commit;
