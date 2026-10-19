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
3. `supabase/migrations/0003_galeria-desde-piezas.sql` — la galería pasa a armarse desde las piezas
4. `supabase/migrations/0004_portada-fondo.sql` — foto de fondo del hero, subida desde `/admin → Contenido`
5. `supabase/migrations/0005_papelera-cotizaciones.sql` — papelera: los descartes se recuperan y se purgan solos

> Correrlas en orden importa. Sin la `0003`, `/admin → Galería` falla al guardar un par. Sin la `0004`, el hero cae a la textura de CSS en lugar de la foto: el sitio funciona igual, solo falta la foto. Sin la `0005`, el botón de eliminar cotizaciones no aparece.

### 4. Usuario admin

**Authentication → Users → Add user** → `Create new user` (dejar marcado el auto-confirm, si aparece la opción).

El trigger `handle_new_user` crea la fila en `profiles` con rol `admin` automáticamente.

### 5. Correr el sitio

```bash
npm install
npm run dev
```

Queda en <http://localhost:4321>.

> `npm install` en esta máquina tarda bastante (la tarjeta SD está al 87%). Si se corta, dejalo correr en segundo plano antes de cortar al agente.

#### El servidor de desarrollo

```bash
npx astro dev --background --host     # arranca en segundo plano y abre la red
npx astro dev status                  # está corriendo? en qué URL
npx astro dev logs                    # ver la salida (--follow para seguirla)
npx astro dev stop                    # apagarlo
```

`--background` es lo cómodo: la terminal queda libre y el servidor sigue. Volver a arrancarlo con uno ya corriendo no duplica nada, solo avisa que ya está.

**`--host` es lo que hace que funcione desde el celular.** Sin esa bandera el servidor solo escucha en la máquina, así que la dirección de red no responde y no se puede probar la subida de fotos desde el teléfono:

```
http://192.168.1.13:4321
```

Dos cosas que confunden la primera vez:

- **Usá `localhost`, no `127.0.0.1`.** El servidor escucha en IPv6, así que `localhost` responde y `127.0.0.1` da error de conexión aunque el servidor esté arriba.
- **El panel es `/admin`** y no hay ningún link a él desde la web pública. Hay que entrar por la URL directa.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (verifica tipos) |
| `npm run preview` | Previsualiza el build |
| `./scripts/versionar.sh fix` | Crea y empuja el próximo `v0.N.z` sobre HEAD |
| `./scripts/versionar.sh minor` | Feature grande: crea y empuja el próximo `v0.N` |

Detalle y tabla del recorrido: [`Docs/15-versionado.md`](./Docs/15-versionado.md).

## Decisiones técnicas

- **Render on-demand, no prerender.** El contenido lo edita el cliente desde `/admin`, así que las páginas se generan por request con `Cache-Control: s-maxage=60` para que los cambios se vean en un minuto sin recargar todo desde cero en cada visita.
- **Solo ANON key.** No hay `service_role` en el servidor ni en el cliente: el acceso lo controlan las policies de RLS de `0001_init.sql`.
- **Storage**: `piezas`, `galeria` y `servicios` son públicos para lectura; `cotizaciones` solo acepta escrituras (las fotos que sube quien cotiza) y no se puede leer.

## Estado

MVP completo: sitio público (inicio, servicios, piezas, galería antes/después, cotización, nosotros, contacto, legal), panel admin con borradores, foco de edición, reordenamiento y deshacer, y migración de galería desde piezas.

Pendiente (fase de perfeccionamiento — `v1.0` aplazado; deploy y dominio no son criterio de corte):

- Verificar en Supabase qué migraciones corrieron (`0003`–`0006`).
- Probar el circuito de fotos de punta a punta: subir → Storage → `piece_photos` → `/piezas`.
- Quitar la cotización de prueba que quedó en la base.
- QA visual y responsive real desde el celular.
- SEO: `robots.txt` + `sitemap.xml` + `og:image` real.
- Deploy a Vercel + dominio `.uy` y video de capacitación: **aplazados** hasta después del perfeccionamiento.