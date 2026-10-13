# 09 — Panel Administrador (ampliación 2026-10-09)

> Ya no es solo catálogo + botón MP. Ahora: **vitrina pública + panel privado** donde el dueño publica piezas y ve disponibilidad, cotizaciones y pagos.

**Actualizado 2026-10-13** (`12-decisiones-mvp-sin-mp.md`): el panel es **parte del MVP** y es también la **herramienta de contenido** — el cliente carga servicios, precios y fotos desde acá. **Mercado Pago sale del MVP** (módulos de órdenes y links MP quedan para Fase 2).

Decisiones tomadas en motor cuestionario:
- Acceso: **Email + clave (Supabase Auth)**
- Módulos MVP: **Servicios + Piezas + Galería + Contenido + Cotizaciones** (órdenes MP → Fase 2)
- Estados pieza: **Con proceso (por_restaurar → en_restauracion → disponible → reservada → vendida)**
- Vista entrada: **Dashboard con tarjetas + tablas + alertas**

## 1. Rutas

```
/admin/login → email + clave, redirige a /admin si sesión
/admin → dashboard (protegido)
/admin/servicios → lista + CRUD servicios (nombre, descripción, rango de precio, orden)
/admin/servicios/nueva → crear
/admin/servicios/:id → editar
/admin/piezas → lista + filtros estado + buscar
/admin/piezas/nueva → crear
/admin/piezas/:id → editar, subir fotos, cambiar estado, ver ficha pública
/admin/cotizaciones → lista solicitudes cotizador guiado
/admin/cotizaciones/:id → detalle + fotos cliente + cambiar estado + botón WhatsApp prellenado
/admin/galeria → antes/después para home (marcar destacadas)
/admin/contenido → datos del taller y textos editables (WhatsApp, dirección, horarios, mapa, redes, nosotros, legal)
/api/admin/* → solo con sesión Supabase (RLS), nunca exponer service_role al frontend
```

Fase 2 (no se implementa ahora): `/admin/ordenes` + generación de links MP.

Público: `/piezas` solo muestra `estado=disponible`; `/servicios` lee la tabla `services`.

## 2. Stack panel (mismo stack, sin costo extra)
- Astro (páginas `/admin/*` con `prerender=false`) + Tailwind mismo tema vintage
- Supabase Auth (email/pass, 1 usuario admin + opcional 1 ayudante)
- Supabase Postgres + Storage (`piezas/`, `servicios/`, `galeria/`, `cotizaciones/`)
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

-- servicios: los carga el cliente desde el panel (nuevo 2026-10-13)
create table services(
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text unique not null,
  descripcion text,
  precio_min int, precio_max int, -- rango referencial en UYU, ambos opcionales
  icono text,                    -- clave de ícono o emoji
  orden int not null default 0,
  activo boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- contenido editable del sitio (WhatsApp, horarios, textos) — una sola fila
create table site_settings(
  id smallint primary key default 1 check (id = 1),
  nombre_taller text,
  whatsapp text, email text, direccion text, horarios text,
  mapa_url text, instagram text, facebook text,
  texto_nosotros text, texto_proceso text, texto_garantia text,
  texto_legal text,
  updated_at timestamptz default now()
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

-- ===== Fase 2 (congelado 2026-10-13): NO migrar hasta integrar Mercado Pago =====
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
-- columnas mp_preference_id / mp_payment_id en `pieces`: también Fase 2
```

RLS:
- `services`, `site_settings`: lectura pública, escritura solo admin.
- `pieces`: lectura pública solo `estado='disponible'`; insert/update/delete solo `auth.role=authenticated + profiles.role=admin`.
- `quotes`: sin lectura pública; solo admin. Creación pública vía `anon` con policy insert-only (sin select).
- Storage: lectura pública en `galeria/` y fotos de piezas disponibles; escritura solo admin.

## 4. Dashboard `/admin`
Tarjetas arriba:
- Disponibles (count + suma $ stock) | En restauración | Servicios activos | Cotizaciones nuevas

Tablas abajo:
- Últimas 8 piezas (foto mini, título, precio, estado chip color, acciones ver/editar)
- Últimas 8 cotizaciones nuevas (nombre, comuna, tipo, hace Xh)
- Servicios sin rango de precio cargado (para que el cliente los complete)

Alertas:
- Pieza `reservada` sin confirmar por WhatsApp >48h → avisar
- Cotización `nueva >24h` sin responder
- Servicios sin descripción o sin precio → recordatorio de completarlo

## 5. CRUD servicios (`/admin/servicios`)
Campos: nombre, slug automático, descripción corta + larga, `precio_min`/`precio_max` (ambos opcionales), ícono, orden (drag), activo (oculta en público sin borrar).

Acciones: duplicar (lustre, pintura...), activar/desactivar, eliminar con confirmación.
Validaciones: rango coherente (`precio_min <= precio_max`), slug único, no puede quedar sin ningún servicio activo.

## 6. CRUD piezas (publicaciones)
Campos: título, slug auto, categoría, precio, costo_compra (privado), descripción, medidas, estado selector, destacada checkbox, fotos drag&drop (máx 8, comprime a 1600px webp), antes/después par.

Acciones:
- Publicar (por_restaurar/en_restauracion → disponible solo si precio>0 + ≥1 foto)
- Pausar / pasar a borrador
- Marcar reservada / vendida (manual; el webhook MP lo hará automático en Fase 2)
- Duplicar (para piezas similares), eliminar con confirmación (solo borrador/pausada)
- Botón "Copiar link de WhatsApp con el texto de la pieza" y "Ver ficha pública"

Validaciones: no se puede poner disponible sin foto ni precio; slug único; precio en UYU (pesos uruguayos, solo números).

## 7. Cotizaciones
- Cambiar estado en 1 click, ingresar `monto_cotizado`, botón WhatsApp con texto prellenado (pieza + monto + resumen).
- Filtros por estado y fecha; export CSV simple.
- Adjuntar la foto del trabajo terminado y marcar `lista` para avisar que está listo para retirar.

## 8. Galería
Subir par antes/después + tag servicio + marcar `destacada home` (máx 6). Reordena con drag. Lo destacado alimenta slider hero vintage.

## 9. Contenido editable (`/admin/contenido`)
Un formulario que edita la fila de `site_settings`: WhatsApp (con botón de copiar link `wa.me`), email, dirección, horarios, URL del mapa, Instagram, Facebook, textos de nosotros/proceso/garantía/legal.
Publicar estos cambios **revalida las páginas públicas** (Astro on-demand) para que se vean sin redeploy manual.

## 10. Seguridad mínima
- Supabase Auth email+clave + "olvidé clave" por email
- Middleware protege `/admin/*`, cierra sesión inactiva 12h
- Service_role solo en server `/api/*`, nunca en cliente
- Backup semanal Supabase + export CSV mensual piezas/cotizaciones
- 1 solo admin al inicio (evita choques stock)

## 11. Criterios de aceptación
- [ ] Login falla con clave mala, entra con buena, sin sesión no entra a /admin
- [ ] Crear servicio desde el celular aparece en `/servicios` en <5s
- [ ] Crear pieza borrador → disponible aparece en /piezas en <5s
- [ ] Cambiar el WhatsApp en `/admin/contenido` actualiza el botón flotante sin tocar código
- [ ] Subir 5 fotos desde celular sin romperse
- [ ] Dashboard carga <2s con 100 piezas

## 12. Impacto en plan
El panel es **núcleo del MVP**, no un extra: sin él el cliente no puede cargar servicios, precios ni fotos y la web queda vacía (ver `12-decisiones-mvp-sin-mp.md`). A cambio, el MVP se ahorra toda la integración de Mercado Pago (preferencia + webhook + páginas de retorno), que es la parte más delicada.
Siguiente: definir categorías fijas + qué servicios por defecto se cargan en la instalación.