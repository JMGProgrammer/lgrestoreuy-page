-- 0003_galeria-desde-piezas.sql — LG Restore Uy
--
-- Cambio de modelo: la galería deja de ser "un par de fotos suelto con un
-- título escrito a mano" y pasa a ser "esta pieza, con esta foto de antes y
-- esta de después".
--
-- Se agrega, no se reescribe: las migraciones ya aplicadas no se tocan.
-- antes_url / despues_url / titulo se conservan como copia resuelta en el
-- momento de guardar, para que la lectura pública siga siendo un select
-- simple y no dependa de joins con la RLS de pieces (que oculta los
-- borradores).

begin;

-- De qué pieza viene el par
alter table public.gallery_items
  add column if not exists piece_id uuid references public.pieces (id) on delete cascade;

-- Qué fotos exactas se eligieron de esa pieza
alter table public.gallery_items
  add column if not exists antes_photo_id uuid references public.piece_photos (id) on delete set null;

alter table public.gallery_items
  add column if not exists despues_photo_id uuid references public.piece_photos (id) on delete set null;

create index if not exists idx_gallery_pieza on public.gallery_items (piece_id);

commit;