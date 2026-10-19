# 15 — Versionado del recorrido

**Fecha:** 2026-10-19
**Estado:** Vigente — 36 tags sobre el historial, esquema en uso desde entonces

## Esquema

Semver `v0.x` mientras no exista versión estable:

| Cambio | Bump | Ejemplo |
|---|---|---|
| Feature grande (subistema o UX nueva) | **minor** → `v0.(N+1)` | `v0.14` hero 3D |
| `fix:` nuevo | **patch** → `v0.N.(z+1)` | `v0.14.1` |
| `feat:` chico, polish, iteración del mismo feature | sin tag | queda dentro del minor vigente |
| `docs:` / `chore:` | sin tag | infra o especificación |
| Primera versión estable | **aplazada** — el sitio sigue en perfeccionamiento; `v1.0` se corta cuando esté a punto | los fixes pasan a `v1.0.x`, features grandes a `v1.1` |

El tag se crea **sobre el commit** que introduce el cambio (no sobre últimos commits sueltos), así `git tag --sort=version:refname` reconstituye todo el recorrido.

## Herramienta

```bash
./scripts/versionar.sh            # estado + qué vendría (no crea nada)
./scripts/versionar.sh fix        # crea y empuja el próximo patch sobre HEAD
./scripts/versionar.sh minor      # crea y empuja el próximo minor sobre HEAD (feature grande)
```

El script se niega a tagear dos veces el mismo HEAD y a crear tags que no encajen con `vX.Y(.Z)`.

## Recorrido versionado (retrospectivo, 2026-10-19)

| Tag | Commit | Qué introduce |
|---|---|---|
| `v0.1` | `5b57727` | Base Astro 7 + Supabase, home y vitrina de piezas |
| `v0.2` | `fb40f9d` | Cotizador en 4 pasos, API de cotizaciones, páginas de contenido |
| `v0.2.1` | `70e496c` | fix orden de la migración init + aridad del seed |
| `v0.3` | `ad1701b` | Panel admin: resumen, servicios CRUD, contenido del sitio |
| `v0.4` | `f4fe516` | Piezas, cotizaciones y galería en el panel + auditoría de seguridad |
| `v0.5` | `35a30f6` | Rework del panel: servicios como app |
| `v0.5.1` | `71e3c5a` | fix Alpine bloqueado por CSP |
| `v0.5.2` | `c49c531` | fix panel sin estilos |
| `v0.6` | `5127c6e` | Edición con borrador y foco (con ordenamiento en vivo) |
| `v0.6.1` | `bd6e96f` | fix reordenado que sigue al cursor |
| `v0.6.2` | `1d60a48` | fix hueco del home + el panel no se filtra al público |
| `v0.7` | `47cbcef` | Comparador antes/después con línea movible |
| `v0.7.1` | `78af2a3` | fix ilustraciones de relleno fuera |
| `v0.8` | `d1d3e73` | Galería armada desde piezas + subida de fotos del dispositivo |
| `v0.8.1` | `25c6fee` | fix vista previa y botón deshabilitado explicado |
| `v0.8.2` | `45f49fb` | fix errores traducidos y misma foto en ambos lados |
| `v0.9` | `1586849` | Cortina diagonal al cambiar de sección |
| `v0.9.1` | `a9be6c3` | fix costura blanca de la cortina |
| `v0.10` | `5543b3f` | Header distribuido + hero a pantalla |
| `v0.10.1`–`v0.10.8` | `f60377a`…`cd9f968` | fixes: login, portada (velo, sepia, recorte), cotizaciones |
| `v0.11` | `53415e1` | Papelera de cotizaciones con purga automática |
| `v0.11.1` | `c4294ae` | fix borrado fallido que seguía guardando |
| `v0.12` | `95159af` | Tarjeta de pieza + visor de ficha (+ compresión de imágenes en el cliente) |
| `v0.12.1` | `f512041` | fix scripts externos por CSP |
| `v0.13` | `259413f` | Home reordenada + sección de servicios con alma |
| `v0.14` | `7a7492d` | Hero 3D con carrusel de piezas (el anillo orbital y sus iteraciones quedan dentro de `v0.14`) |
| `v0.14.1` | `fb91397` | fix centro de giro del anillo |
| `v0.14.2` | `8a8b6a5` | fix medidas del anillo con perspectiva |
| `v0.15` | `3f0bc8f` | Galería por destino de uso: pestañas, chips y librería de assets (plan 14) |
| `v0.16` | `926810c` | Accesibilidad pública: pausa manual del carrusel 3D, foco siempre visible, valuetext en el comparador |
| `v0.16.1` | `ce1c0dd` | fix confirmaciones CSP-safe: diálogo propio del panel reemplaza onclick inline (bloqueados en prod) + Papelera pregunta antes de borrar |
| `v0.17` | `fe164a6` | Panel visible: papelera en la nav con badge, 7 secciones en el nav del celu, botones con iconos en vez de links subrayados |
| `v0.18` | `3cd79f0` | Panel manejable: miniaturas en la lista de piezas, búsqueda de texto, WhatsApp por fila, pasos que desaparecen al cumplirse y guard en Contenido |

Sigue en `v0.15`: **sin fixes después del último minor**, HEAD pendiente de tag en el próximo feature grande (`v0.16`) o fix (`v0.15.1`).

## v1.0, aplazado (2026-10-19)

El sitio está en fase de perfeccionamiento: **deploy y dominio no son el disparador de `v1.0`** ni desbloquean nada. La estable se corta cuando la calidad del sitio esté a punto. La planificación de refinamiento sigue en 0.x (`v0.16` en adelante) con el mismo mecanismo.
