-- 0005_papelera-cotizaciones.sql — LG Restore Uy
--
-- Papelera para las cotizaciones.
--
-- Por qué una papelera y no un DELETE seco: la base es de los planes
-- gratuitos y no llega ni cerca del límite, así que guardar 30 días de
-- solicitudes descartadas no cuesta nada. A cambio, un borrado accidental
-- deja de ser un problema sin vuelta atrás. Y las fotos que mandó el
-- visitante tampoco quedan huérfanas en el bucket desde el primer momento.
--
-- El borrado es una COPIA de la fila: quotes queda limpio y las consultas
-- del día a día no necesitan filtrar por nada. La tabla crece sola hasta el
-- purgado.
--
-- La RLS es solo para el admin, como en el resto del panel: la papelera no
-- se puede leer desde el sitio público.

begin;

create table if not exists public.quotes_borradas (
  -- Mismo id que tenía en quotes. Se usa para restaurar sin cambiar nada.
  id uuid primary key,

  nombre text not null,
  telefono text not null,
  comuna text,
  tipo_mueble text,
  servicio text,
  medidas text,
  descripcion text,
  fotos text[] not null default '{}',
  estado text not null,

  monto_cotizado int,
  monto_abono int,

  -- Cuándo llegó el pedido original
  created_at timestamptz not null,
  -- Cuándo lo mandó a la papelera
  borrada_at timestamptz not null default now(),
  -- Cuándo se purga solo. Índice encima porque el purgado filtra por esto.
  se_borra_el timestamptz not null default (now() + interval '3 days')
);

alter table public.quotes_borradas enable row level security;

drop policy if exists papelera_admin on public.quotes_borradas;
create policy papelera_admin on public.quotes_borradas
  for all using (public.is_admin()) with check (public.is_admin());

-- El purgado pregunta siempre "¿ya venció alguna?", así que el índice va
-- sobre la fecha de purgado y no sobre la de baja.
create index if not exists idx_papelera_se_borra_el
  on public.quotes_borradas (se_borra_el);

commit;

-- ---------------------------------------------------------------------
-- Nota sobre el purgado automático
--
-- El purgado real corre desde la web, en la primera visita a /admin/papelera:
-- borra la fila de quotes_borradas Y los archivos del bucket, en ese orden.
--
-- no se usa pg_cron a propósito. Storage tiene un trigger que impide borrar
-- desde SQL (storage.protect_delete), así que un job de base no podría
-- limpiar los archivos: dejaría huérfanos en el bucket. Y sin abrir el panel
-- no hay nada que purgar de todos modos, porque mientras tanto la fila y los
-- archivos siguen existiendo, y eso ya es el purgado.
--
-- Si algún día se quiere purgar por reloj y no por visita, el camino es un
-- pg_cron que borre las filas y deje las fotos: son unos pocos KB por
-- pedido y el bucket es privado.