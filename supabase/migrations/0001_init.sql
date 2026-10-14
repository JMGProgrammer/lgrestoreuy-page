-- 0001_init.sql — LG Restore Uy
-- MVP sin Mercado Pago. Ver Docs/10-modelo-relacional.md y Docs/09-panel-admin.md
-- Aplicar en el SQL Editor de Supabase o con `supabase db push`.

create extension if not exists pgcrypto;

-- =====================================================================
-- Helper: ¿el usuario actual es admin del panel?
-- security definer para no disparar la RLS de profiles dentro de la policy.
-- =====================================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'ayudante')
  );
$$;

-- =====================================================================
-- Tablas
-- =====================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  role text not null default 'admin' check (role in ('admin', 'ayudante')),
  created_at timestamptz not null default now()
);

-- Servicios: los carga el cliente desde /admin/servicios
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text unique not null,
  descripcion text,
  precio_min int check (precio_min is null or precio_min >= 0),
  precio_max int check (precio_max is null or precio_max >= 0),
  icono text,
  orden int not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_rango_coherente check (
    precio_min is null or precio_max is null or precio_min <= precio_max
  )
);

-- Contenido editable del sitio: una sola fila (id = 1)
create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  nombre_taller text not null default 'L&G Restore',
  whatsapp text,          -- formato internacional sin signos: 59890123456
  email text,
  direccion text,
  horarios text,
  mapa_url text,
  instagram text,
  facebook text,
  texto_nosotros text,
  texto_proceso text,
  texto_garantia text,
  texto_legal text,
  updated_at timestamptz not null default now()
);

-- Piezas:vitrina + gestión del taller
create table if not exists public.pieces (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  titulo text not null,
  descripcion text,
  categoria text,
  precio int not null check (precio > 0),
  costo_compra int check (costo_compra is null or costo_compra >= 0),
  estado text not null default 'por_restaurar'
    check (estado in ('por_restaurar', 'en_restauracion', 'disponible', 'reservada', 'vendida', 'pausada', 'borrador')),
  destacada boolean not null default false,
  medidas text,
  ubicacion text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.piece_photos (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null references public.pieces (id) on delete cascade,
  storage_path text not null,
  url text not null,
  rol text not null default 'general' check (rol in ('general', 'antes', 'despues')),
  orden int not null default 0,
  created_at timestamptz not null default now()
);

-- Galería antes/después del hero
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  titulo text,
  antes_url text not null,
  despues_url text not null,
  tag_servicio text,
  destacada_home boolean not null default false,
  orden int not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Cotizaciones del formulario guiado
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text not null,
  comuna text,
  tipo_mueble text,
  servicio text,
  medidas text,
  descripcion text,
  fotos text[] not null default '{}',
  estado text not null default 'nueva'
    check (estado in ('nueva', 'cotizada', 'aceptada', 'en_taller', 'lista', 'entregada', 'rechazada')),
  monto_cotizado int check (monto_cotizado is null or monto_cotizado >= 0),
  monto_abono int check (monto_abono is null or monto_abono >= 0),
  created_at timestamptz not null default now()
);

-- =====================================================================
-- updated_at automático
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['services', 'site_settings', 'pieces']
  loop
    execute format('drop trigger if exists trg_%1$s_updated_at on public.%1$I', t);
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$I
       for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

-- Crear profile automáticamente al crear el usuario en Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'admin')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Índices
-- =====================================================================
create index if not exists idx_services_activo_orden on public.services (activo, orden);
create index if not exists idx_pieces_estado on public.pieces (estado);
create index if not exists idx_pieces_destacada on public.pieces (destacada) where estado = 'disponible';
create index if not exists idx_piece_photos_piece on public.piece_photos (piece_id, orden);
create index if not exists idx_gallery_destacada on public.gallery_items (destacada_home, orden);
create index if not exists idx_quotes_estado_fecha on public.quotes (estado, created_at desc);

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.profiles      enable row level security;
alter table public.services      enable row level security;
alter table public.site_settings enable row level security;
alter table public.pieces        enable row level security;
alter table public.piece_photos  enable row level security;
alter table public.gallery_items enable row level security;
alter table public.quotes        enable row level security;

-- profiles: solo el propio usuario y admins
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- services: lectura pública, escritura admin
drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services for select using (true);

drop policy if exists services_admin_write on public.services;
create policy services_admin_write on public.services
  for all using (public.is_admin()) with check (public.is_admin());

-- site_settings: lectura pública, escritura admin
drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read on public.site_settings for select using (true);

drop policy if exists site_settings_admin_write on public.site_settings;
create policy site_settings_admin_write on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- pieces: pública solo lo disponible
drop policy if exists pieces_public_read on public.pieces;
create policy pieces_public_read on public.pieces
  for select using (estado = 'disponible' or public.is_admin());

drop policy if exists pieces_admin_write on public.pieces;
create policy pieces_admin_write on public.pieces
  for all using (public.is_admin()) with check (public.is_admin());

-- piece_photos: pública si la pieza está disponible
drop policy if exists piece_photos_public_read on public.piece_photos;
create policy piece_photos_public_read on public.piece_photos
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.pieces p
      where p.id = piece_id and p.estado = 'disponible'
    )
  );

drop policy if exists piece_photos_admin_write on public.piece_photos;
create policy piece_photos_admin_write on public.piece_photos
  for all using (public.is_admin()) with check (public.is_admin());

-- gallery_items: lectura pública
drop policy if exists gallery_public_read on public.gallery_items;
create policy gallery_public_read on public.gallery_items for select using (true);

drop policy if exists gallery_admin_write on public.gallery_items;
create policy gallery_admin_write on public.gallery_items
  for all using (public.is_admin()) with check (public.is_admin());

-- quotes: cualquiera puede enviar una, nadie la lee salvo el admin
drop policy if exists quotes_public_insert on public.quotes;
create policy quotes_public_insert on public.quotes
  for insert with check (estado = 'nueva');

drop policy if exists quotes_admin_read on public.quotes;
create policy quotes_admin_read on public.quotes
  for select using (public.is_admin());

drop policy if exists quotes_admin_write on public.quotes;
create policy quotes_admin_write on public.quotes
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Storage
-- piezas / galeria / servicios: lectura pública, escritura admin
-- cotizaciones: solo escritura anónima (fotos del formulario), sin lectura
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('piezas', 'piezas', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('galeria', 'galeria', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('servicios', 'servicios', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('cotizaciones', 'cotizaciones', false)
on conflict (id) do nothing;

drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects
  for select using (bucket_id in ('piezas', 'galeria', 'servicios'));

drop policy if exists storage_admin_write on storage.objects;
create policy storage_admin_write on storage.objects
  for all using (public.is_admin()) with check (public.is_admin());

-- El cotizador sube sus fotos de forma anónima: permitimos insert en ese bucket
drop policy if exists storage_quote_upload on storage.objects;
create policy storage_quote_upload on storage.objects
  for insert with check (bucket_id = 'cotizaciones');