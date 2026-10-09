# 09 — Panel Administrador (ampliación 2026-10-09)

> Ya no es solo catálogo + botón MP. Ahora: **vitrina pública + panel privado** donde el dueño publica piezas y ve disponibilidad, cotizaciones y pagos.

Decisiones tomadas en motor cuestionario:
- Acceso: **Email + clave (Supabase Auth)**
- Módulos: **Completo (piezas + cotizaciones + órdenes MP + galería)**
- Estados pieza: **Con proceso (por_restaurar → en_restauracion → disponible → reservada → vendida)**
- Vista entrada: **Dashboard con tarjetas + tablas + alertas**

## 1. Rutas

```
/admin/login → email + clave, redirige a /admin si sesión
/admin → dashboard (protegido)
/admin/piezas → lista + filtros estado + buscar
/admin/piezas/nueva → crear
/admin/piezas/:id → editar, subir fotos, cambiar estado, ver orden asociada
/admin/cotizaciones → lista solicitudes cotizador guiado
/admin/cotizaciones/:id → detalle + fotos cliente + cambiar estado + generar link MP
/admin/ordenes → pagos MP (pagada/pendiente/fallida) + reenviar link
/admin/galeria → antes/después para home (marcar destacadas)
/api/admin/* → solo con sesión Supabase (RLS), nunca exponer service_role al frontend
```

Público sigue igual: `/piezas` solo muestra `estado=disponible`, `/piezas/:slug` con botón MP.

## 2. Stack panel (mismo stack, sin costo extra)
- Astro (páginas `/admin/*` con `prerender=false`) + Tailwind mismo tema vintage
- Supabase Auth (email/pass, 1 usuario admin + opcional 1 ayudante)
- Supabase Postgres + Storage (`piezas/`, `cotizaciones/`, `galeria/`)
- Middleware Astro que verifica sesión y rol `admin`, sino 302 a `/admin/login`

## 3. Modelo datos final (SQL)

```sql
-- roles simples
create table profiles(
  id uuid primary key references auth.users(id),
  email text unique not null,
  role text not null default 'admin' check (role in ('admin','ayudante')),
  created_at timestamptz default now()
);

create table pieces(
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  titulo text not null,
  descripcion text,
  categoria text, -- silla, mesa, comoda, reloj, cuadro, etc.
  precio int not null check (precio > 0),
  costo_compra int, -- cuánto le costó comprarla (privado, no público)
  estado text not null default 'por_restaurar'
    check (estado in ('por_restaurar','en_restauracion','disponible','reservada','vendida','pausada','borrador')),
  destacada boolean default false,
  fotos text[] default '{}', -- urls Storage
  antes_url text, despues_url text, -- para slider
  medidas text, ubicacion text,
  mp_preference_id text, mp_payment_id text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table quotes(
  id uuid primary key default gen_random_uuid(),
  nombre text not null, telefono text not null, comuna text,
  tipo_mueble text, servicio text, medidas text, descripcion text,
  fotos text[] default '{}',
  estado text default 'nueva' check (estado in ('nueva','cotizada','aceptada','en_taller','lista','entregada','rechazada')),
  monto_cotizado int, monto_abono int,
  created_at timestamptz default now()
);

create table orders(
  id uuid primary key default gen_random_uuid(),
  piece_id uuid references pieces(id),
  quote_id uuid references quotes(id),
  tipo text not null check (tipo in ('total_pieza','abono','saldo')),
  monto int not null,
  nombre_comprador text, telefono text, email text,
  mp_preference_id text, mp_payment_id text, mp_status text,
  estado text default 'pendiente' check (estado in ('pendiente','pagada','fallida','reembolsada')),
  created_at timestamptz default now()
);
```

RLS:
- `pieces`: lectura pública solo `estado='disponible'`; insert/update/delete solo `auth.role=authenticated + profiles.role=admin`.
- `quotes`, `orders`: sin lectura pública; solo admin. Creación de quote/order pública vía `anon` con policy insert-only (sin select).
- Storage: lectura pública en `galeria/` y fotos de piezas disponibles; escritura solo admin.

## 4. Dashboard `/admin` (lo que pidió: ver disponibles + alertas)
Tarjetas arriba:
- Disponibles (count + suma $ stock) | En restauración | Reservadas | Cotizaciones nuevas | Pagos pendientes

Tablas abajo:
- Últimas 8 piezas (foto mini, título, precio, estado chip color, acciones ver/editar)
- Últimas 8 cotizaciones nuevas (nombre, comuna, tipo, hace Xh)
- Últimas órdenes fallidas/pendientes (reenviar link MP)

Alertas:
- Pieza `reservada >48h` sin pago → avisar liberar
- Cotización `nueva >24h` sin responder

## 5. CRUD piezas (publicaciones)
Campos: título, slug auto, categoría, precio, costo_compra (privado), descripción, medidas, estado selector, destacada checkbox, fotos drag&drop (máx 8, comprime a 1600px webp), antes/después par.

Acciones:
- Publicar (por_restaurar/en_restauracion → disponible solo si precio>0 + ≥1 foto)
- Pausar / pasar a borrador
- Marcar reservada (crea order pendiente) / vendida (manual o auto por webhook MP)
- Duplicar (para piezas similares), eliminar con confirmación (solo borrador/pausada)
- Botón "Copiar link pago MP" y "Ver ficha pública"

Validaciones: no se puede poner disponible sin foto ni precio; slug único; precio en UYU (pesos uruguayos, solo números).

## 6. Cotizaciones + Órdenes
- Cotización: cambiar estado en 1 click, ingresar `monto_cotizado + abono`, botón "Generar link MP abono" (crea order tipo abono + preferencia), botón WhatsApp con texto prellenado.
- Órdenes: ver preference/payment_id, estado MP, reenviar link, marcar reembolsada manual, filtro por tipo/estado.
- Webhook MP actualiza `orders.estado=pagada` → si es total_pieza, `pieces.estado=vendida` automático; si es abono, `quotes.estado=aceptada`.

## 7. Galería
Subir par antes/después + tag servicio + marcar `destacada home` (máx 6). Reordena con drag. Lo destacado alimenta slider hero vintage.

## 8. Seguridad mínima
- Supabase Auth email+clave + "olvidé clave" por email
- Middleware protege `/admin/*`, cierra sesión inactiva 12h
- Service_role solo en server `/api/*`, nunca en cliente
- Backup semanal Supabase + export CSV mensual piezas/órdenes
- 1 solo admin al inicio (evita choques stock)

## 9. Criterios de aceptación
- [ ] Login falla con clave mala, entra con buena, sin sesión no entra a /admin
- [ ] Crear pieza borrador → disponible aparece en /piezas en <5s
- [ ] Pagar pieza TEST → webhook marca orden pagada + pieza vendida + desaparece de disponibles
- [ ] Subir 5 fotos desde celular sin romperse
- [ ] Dashboard carga <2s con 100 piezas

## 10. Impacto en plan
Suma aprox +40% sobre MVP sin panel (auth + RLS + CRUD + dashboard + storage). Pero ahorra plan mensual manual: el dueño se autoatiende y tú solo mantienes.
Siguiente: definir categorías fijas + campos obligatorios ficha + quién saca fotos.
