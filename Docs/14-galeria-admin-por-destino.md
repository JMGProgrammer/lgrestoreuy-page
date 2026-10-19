# 14 — Galería admin por destino de uso + librería de assets

> Estado: **PLAN CERRADO (2026-10-19), pendiente de implementar.**
> Migración única del plan: `0006_hero-anillo-assets.sql` (`pieces.en_anillo` + tabla `assets` + bucket `assets` + policy de lectura).
> Origen: la prueba pendiente del circuito de fotos lanzó la pregunta "¿dónde termina cada foto que el cliente sube?" — hoy no hay forma de verlo ni controlarlo por sección.

## 1. Cómo viaja una foto hoy (vista del administrador)

| Se muestra en… | De dónde sale | ¿El cliente decide? |
|---|---|---|
| Ficha de la pieza | `piece_photos` (bucket `piezas`), `rol` = `general`/`antes`/`despues`, `orden` | Sí (desde la ficha de cada pieza) |
| Anillo 3D del hero | Las **primeras 8 piezas con foto**; de cada una sale `fotos[0]` (la portada) | **No** — es automático, no se elige |
| Comparador antes/después | `gallery_items` → `antes_photo_id` / `despues_photo_id` (migración 0003) | Sí (galería admin) |
| Fondo de la portada | `site_settings.portada_url` (bucket `portada`) | Sí, pero desde `/admin/contenido`, lejos de la galería |
| Cotizaciones | Bucket privado `cotizaciones` (links firmados 1 h) | No aplica (sube el visitante) |

Problema: cuando el cliente sube una foto no sabe en qué secciones del sitio va a aparecer, y hay secciones completas (anillo, fondo) sin control directo.

## 2. Objetivo

Que `/admin/galeria` se organice **por destino de uso**:

1. Pestañas: **Piezas · Antes/Después · Hero · Librería**
2. Control explícito del anillo del hero: qué 8 piezas entran y qué foto muestra cada una
3. Chips "dónde se usa" en cada foto (Anillo · Ficha · Comparador · Fondo)
4. Librería de `assets`: fotos sueltas que no son piezas y quedan disponibles para features futuras

## 3. Features (trabajo de código)

### 3.1 Pestañas en `/admin/galeria`

La vista plana pasa a paginarse por query `?tab=piezas|comparador|hero|libreria` (server-side, sin JS nuevo).

| Tab | Qué contiene |
|---|---|
| `piezas` | Manager compacto de fotos por pieza (3.3) |
| `comparador` | Lo ya existente: par pieza/foto por lado + `destacada_home` |
| `hero` | Anillo del hero (3.2) + fondo de portada (3.5) |
| `libreria` | Assets sueltos (3.4) |

### 3.2 Anillo del hero bajo control del cliente

```sql
alter table public.pieces
  add column if not exists en_anillo boolean not null default false;
```

- Pestaña `hero`: hasta 8 slots. Por slot: elegir pieza (select; patrón ya usado en esta misma página) y la foto de esa pieza (por defecto, la portada).
- Se resuelve con `en_anillo` + orden de piezas. Sin columna extra de "foto del anillo": el slot usa la misma foto de portada que la ficha. Si más adelante se pide una foto distinta solo para el anillo, se agrega `anillo_photo_id` — no sobre-ingeniería ahora.
- **Fallback:** si ninguna pieza tiene `en_anillo`, la home cae al comportamiento actual (primeras 8 con foto). La home del cliente no cambia hasta que él decida.

### 3.3 Manager compacto de fotos por pieza

Pestaña `piezas`: elegir pieza → subir con rol (campo ya existente: general/antes/despues), reordenar, borrar, editar alt. Es una vista rápida de lo que hoy se gestiona pieza por pieza; no reemplaza la ficha.

### 3.4 Librería de assets (bucket `assets` + tabla `assets`)

```sql
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  url text not null,
  alt text,
  tag text not null default 'otro'
    check (tag in ('ambiente', 'textura', 'personal', 'logo', 'otro')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
```

- Subida con etiqueta (`tag`) + alt. La librería nace **vacía** (regla de no relleno, doc 12).
- No amarrados a piezas: quedan listos para "Nosotros", servicios, futuras secciones, redes.
- Borrado con el patrón del proyecto: fila + archivo juntos, avisando si el asset está en uso (ej. como fondo del hero).
- Fondo de portada: desde la pestaña `hero` se puede **elegir de la librería** (tag `ambiente`) o **subir directo** (que ya registra el asset). `site_settings.portada_url` no cambia — solo se alimenta de otra forma.

### 3.5 Chips "dónde se usa" en cada foto

Por foto, chips derivados en la vista (sin guardar nada):

- `Ficha` → toda foto de pieza
- `Anillo` → es la foto del slot del anillo de esa pieza
- `Comparador` → si algún `gallery_items` la referencia
- `Fondo` → coincide con `site_settings.portada_url`

### 3.6 Limpieza opcional del bucket `galeria` legacy

Quedó huérfano desde 0003 (la galería sale de piezas). Congelado hasta revisar; no bloquea nada.

## 4. Archivos tocados

| Archivo | Cambio |
|---|---|
| `supabase/migrations/0006_hero-anillo-assets.sql` | `pieces.en_anillo` + tabla `assets` + bucket `assets` + policy de lectura |
| `src/pages/admin/galeria.astro` | Pestañas + tab `hero` + tab `libreria` + chips "dónde se usa" |
| `src/lib/admin.ts` | CRUD de assets + helper "fotos en uso" + query del anillo |
| `src/pages/index.astro` | Query del anillo con fallback |

Fuera de scope: `CarruselPiezas.astro` (recibe las piezas armadas), RLS de lectura, resto de la web pública.

## 5. Orden de implementación

1. Migración `0006` + query del anillo en la home (con fallback)
2. Pestaña `hero` + chips "dónde se usa"
3. Pestaña `libreria` + conexión fondo ↔ assets
4. Pestaña `piezas` (manager compacto) + pulido del comparador
5. En el proceso: prueba punta a punta del circuito de fotos con una foto real de 3000+ px

---

## 6. Pasos EXTERNOS a coding

### 6.1 Supabase — SQL Editor y Storage (dashboard del proyecto)

> ⚠️ Estado 2026-10-19: **0005 verificada como aplicada** (la tabla `quotes_borradas` existe; el header `?column?` del SQL Editor es solo una columna sin alias, no un error).

1. ~~Aplicar 0005~~ — ya está aplicada.
2. **Aplicar 0006** (`supabase/migrations/0006_hero-anillo-assets.sql`): ya escrita y **idempotente** (se puede correr sin riesgo, incluso dos veces). Es aditiva: la home no cambia mientras nadie marque `en_anillo`. Puede aplicarse ya, aunque lo natural es la misma visita que el deploy del código del plan.
3. Verificar en **Storage → Policies** que la regla de lectura pública incluye los buckets `piezas / galeria / servicios / portada / assets` — la lista `in (...)` está escrita a mano en 0001 y 0004.
4. **Tope por archivo en `cotizaciones`** (pendiente del audit del doc 13): Storage → bucket `cotizaciones` → limitar tamaño de archivo a **10 MB**.
5. **Borrar la cotización de prueba** (otro pendiente del audit): SQL `delete from public.quotes where nombre = 'Test';` — el rol anon no puede, lo hace el dueño.

### 6.2 Cliente (L&G) — decisiones y contenido

6. **Fotos reales del taller** — el mayor límite de conversión: al menos 2–3 piezas con par antes/después (usando el `rol` al subir) + fotos generales. Vía recomendada: **desde el celular** (la compresión de admin, 1920 px / q0.82, está pensada para eso).
7. **Elegir las piezas del anillo del hero** (hasta 8): marcar en el panel una vez que la pestaña `hero` exista.
8. **Decidir el fondo de portada**: foto real de ambiente (Librería, tag `ambiente`) vs. la textura generada actual (`portada.svg`).
9. **Alt texts**: una línea por foto que describa la pieza (gana accesibilidad y SEO).
10. **Probar el circuito punta a punta en serio** (justifica todo este trabajo): subir una foto grande (3000+ px) desde `/admin` → verla en la ficha → en `/piezas` → marcar la pieza para el anillo y verla en el hero del home → confirmar que la compresión dejó la subida liviana (< ~1.5 MB).

### 6.3 Operación

11. **Verificar prod en celular real** (push del 18/10 ya desplegó el anillo 3D en Vercel): el anillo está diseñado con hover en desktop; en táctil el comportamiento es otro.
12. **Re-lanzar el checklist de seguridad del doc 13** con 0005 + 0006 aplicadas (hubo cambios de esquema y un bucket nuevo).
13. **Video de capacitación** (pendiente #3): grabar el panel completo — ahora con más contenido: pestañas de galería, anillo, librería, dónde aparece cada foto.

### 6.4 Después del impacto

14. Si el anillo necesita más grano fino que "la foto de portada", se suma `anillo_photo_id` a partir de uso real — no antes.
