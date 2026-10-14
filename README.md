# L&G Restore Uy

Web del taller de restauración de muebles y antigüedades.

**Alcance actual:** MVP **sin Mercado Pago**. Cada pieza y cada consulta se conversan por WhatsApp. Servicios, precios, fotos y textos los carga el cliente desde `/admin`.

- Especificación completa: [`Docs/`](./Docs/README.md)
- Decisiones de alcance: [`Docs/12-decisiones-mvp-sin-mp.md`](./Docs/12-decisiones-mvp-sin-mp.md)

## Stack

- Astro 7 + Tailwind CSS 4 (tema vintage retro)
- Supabase (Postgres + Storage + Auth) — sin backend propio
- Panel admin en `/admin` (mismo stack, sin costo extra)
- Deploy: Vercel + dominio .uy

## Puesta en marcha

### 1. Proyecto Supabase

1. Entrar a <https://supabase.com> → **New project**.
2. Elegir nombre, contraseña de base de datos y una región cercana (la más próxima a Uruguay).
3. Cuando termine, ir a **Settings → API** y copiar:
   - **Project URL** → `PUBLIC_SUPABASE_URL`
   - **anon / public key** (en versiones nuevas: *Publishable key*) → `PUBLIC_SUPABASE_ANON_KEY`
4. Pasar esos dos valores al chat y llenar el `.env`.

> No hace falta `service_role`: toda escritura pasa por las policies de RLS con la sesión del admin.

### 2. Variables de entorno

```bash
cp .env.example .env
```

```env
PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_ANON
```

### 3. Migraciones

En **SQL Editor → New query**, pegar y ejecutar en orden:

1. `supabase/migrations/0001_init.sql` — tablas, índices, RLS y buckets de Storage
2. `supabase/migrations/0002_seed.sql` — servicios de ejemplo y fila de `site_settings`

### 4. Usuario admin

**Authentication → Users → Add user** → `Create new user` (dejar marcado el auto-confirm, si aparece la opción).

El trigger `handle_new_user` crea la fila en `profiles` con rol `admin` automáticamente.

### 5. Correr el sitio

```bash
npm install
npm run dev
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (verifica tipos) |
| `npm run preview` | Previsualiza el build |

## Decisiones técnicas

- **Render on-demand, no prerender.** El contenido lo edita el cliente desde `/admin`, así que las páginas se generan por request con `Cache-Control: s-maxage=60` para que los cambios se vean en un minuto sin recargar todo desde cero en cada visita.
- **Solo ANON key.** No hay `service_role` en el servidor ni en el cliente: el acceso lo controlan las policies de RLS de `0001_init.sql`.
- **Storage**: `piezas`, `galeria` y `servicios` son públicos para lectura; `cotizaciones` solo acepta escrituras (las fotos que sube quien cotiza) y no se puede leer.

## Estado

Base del proyecto + capa de datos + migraciones. Pendiente: tema vintage, páginas públicas y panel admin (ver `Docs/06-roadmap-next-steps.md`).