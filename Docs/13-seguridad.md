# 13 — Seguridad del proyecto

**Fecha:** 2026-10-14
**Alcance:** quién puede ver y tocar el panel `/admin`, y qué ve un visitante del sitio público.

Este documento registra las **pruebas reales** que se hicieron contra la base de datos, no solo la intención del diseño. Cada tabla del panel se-put尝试 con peticiones anónimas usando la clave pública.

## Principio

El panel se protege en **tres capas independientes**. Si una falla, las otras dos siguen:

| Capa | Dónde vive | Qué hace |
|---|---|---|
| 1. Rutas | `src/middleware.ts` | Sin sesión, `/admin` y `/api/admin` redirigen al login |
| 2. Sesión | Supabase Auth | Cookies httpOnly firmadas, nunca en el bundle |
| 3. Permisos | RLS en Postgres | La base no entrega ni una fila sensible sin sesión de admin |

La capa 3 es la importante: **no está en el código**. Si el deploy sale mal, aunque el sitio se rompa, la base sigue cerrada.

## Qué puede ver un visitante sin iniciar sesión

Probado con la clave pública, sin sesión, contra la API de Supabase:

| Tabla | Filas visibles | Por qué |
|---|---|---|
| `services` | 5 | Es contenido público: lo muestra `/servicios` |
| `site_settings` | 1 | Nombre, WhatsApp, dirección y textos: también públicos |
| `pieces` | 0 | Solo las `disponible`; ahora no hay ninguna publicada |
| `piece_photos` | 0 | Solo las fotos de piezas disponibles |
| `gallery_items` | 0 | La galería se llena desde el panel |
| `quotes` | **0** | **Nadie fuera del panel ve una cotización** |
| `profiles` | **0** | **Los usuarios del panel no se pueden enumerar** |

## Qué puede hacer un visitante sin sesión

| Acción | Resultado |
|---|---|
| Insertar en `services`, `pieces`, `gallery_items`, `profiles` | ❌ bloqueado |
| Modificar o borrar cualquier dato | ❌ bloqueado (verificado: el dato sigue intacto) |
| Leer `quotes` o `profiles` | ❌ devuelve vacío |
| Subir al bucket `piezas` (público) | ❌ bloqueado |
| Leer públicamente el bucket `cotizaciones` | ❌ bloqueado (bucket privado) |
| Subir al bucket `cotizaciones` | ✅ permitido: es el formulario público |
| Insertar una cotización | ✅ permitido: es el formulario público |

> Ojo con un falso positivo: una modificación bloqueada devuelve `204` igual que una exitosa. Siempre se verificó releyendo el dato.

## Upload de archivos

El cotizador sube fotos **desde el navegador** con la clave pública, así que el filtro está en dos lugares:

- **Cliente**: solo JPG, PNG, WebP o GIF, hasta 8 MB, máximo 5 fotos.
- **Servidor** (subida desde el panel): mismas reglas, en `subirImagen()`.

Nunca se confía en el atributo `accept` del input: es una sugerencia de la interfaz y se puede saltear.

Las fotos de las cotizaciones quedan en un bucket **privado** y el panel las abre con **links firmados de 1 hora**. La URL no sirve para compartirla ni para verla más tarde.

## Cabeceras de seguridad

Las agrega el middleware en todas las respuestas:

| Cabecera | Para qué |
|---|---|
| `Content-Security-Policy` | Solo se carga código del propio sitio, imágenes de Supabase y fuentes de Google |
| `X-Frame-Options: DENY` | Nadie puede meter el panel dentro de un iframe |
| `X-Content-Type-Options: nosniff` | Evita que el navegador interprete un archivo como HTML |
| `Referrer-Policy` | No se filtra la URL de las fotos firmadas al saltar a otro sitio |
| `Permissions-Policy` | Sin cámara, micrófono ni geolocalización |
| `Strict-Transport-Security` | Fuerza HTTPS en Vercel |
| `X-Robots-Tag: noindex` | Solo en `/admin`: Google no lo indexa |

### Por qué el panel necesita `unsafe-eval`

Alpine evalúa sus expresiones con `new Function()`. Con la CSP estricta
(`script-src 'self'`) cada directiva lanza `EvalError` y la pantalla queda
visible pero **sin comportamiento**: los botones no hacen nada.

La alternativa es el build `@alpinejs/csp`, que no usa `eval` pero obliga a
reescribir todo el markup (nada de llamadas en `x-data`, nada de argumentos en
los handlers). El costo no compensó el beneficio.

**Decisión:** `unsafe-eval` queda **solo en el panel**, que es una superficie de
ataque mucho menor que la web pública. La web pública sigue con `script-src
'self'`: no evalúa nada. Los textos que el cliente carga desde `/admin` salen
por Astro escapados (no se usa `set:html`), así que no hay vector de inyección
 conocido que aproveche.

En desarrollo se suma `unsafe-inline` porque la barra de herramientas de Astro
inyecta scripts en línea. En producción no existe y no está permitido.

## Endurecimientos aplicados en el camino

1. **`/api/admin/*` no estaba protegido.** El middleware cubría `/admin/*` pero las APIs viven en `/api/admin/*`, que no empieza por `/admin`. No era explotable (la RLS frenaba), pero faltaba una capa.
2. **Validación de archivos en el cotizador.** No había ninguna: se subía lo que el visitante eligiera. Agregada.
3. **Redirect abierto en el login.** El parámetro `?next=` ahora solo acepta rutas que empiezan por `/admin`.
4. **`unsafe-inline` solo en las páginas públicas.** El panel no lo lleva: sus scripts son externos.
5. **`noindex` en login y panel.**

## Riesgos que quedan abiertos

Estos no son bugs, son decisiones que conviene revisar antes de publicar:

### 1. El bucket `cotizaciones` acepta subida anónima sin límite

Hace falta para que el formulario funcione sin sesión, pero significa que cualquiera con la URL del proyecto puede subir archivos ahí.

**Mitigación recomendada (gratis, en el panel de Supabase):** *Storage → cotizaciones → Configuration → File size limit* en 10 MB. Hoy el plan free permite hasta 50 MB por archivo.

** Riesgo residual:** alguien que descubra la URL podría llenar la cuota de almacenamiento con archivos basura. No puede leerlos ni publicarlos. Si molesta, la salida es pasar la subida por el servidor (con rate limiting) en la Fase 2.

### 2. No hay límite de peticiones

El formulario de cotización y la subida de fotos no tienen rate limiting. Un bot podría generar muchas cotizaciones falsas.

**Para este MVP no molesta:** el taller las revisa y las borra. Si empieza a pasar, la solución es un *honeypot* invisible en el formulario + límite por IP en Vercel.

### 3. Un solo usuario

Hoy hay un único administrador con rol `admin`. Si el taller quiere que otra persona cargue fotos pero no toque precios, se crea otro usuario en Supabase Auth y se le asigna `ayudante` en `profiles`. La RLS ya lo contempla.

### 4. `npm audit` reporta 3 vulnerabilidades altas

Vienen de `path-to-regexp`, una dependencia transitiva de `@vercel/routing-utils` (el adaptador de Vercel). El "fix" que ofrece npm sería **bajarte a `@astrojs/vercel@8`**, incompatible con Astro 7.

**Decisión:** no se aplica. Es una dependencia de build/despliegue, no de runtime del sitio, y el precio (romper el adapter) es peor que el riesgo. Se revisa cuando haya una versión de `@astrojs/vercel` que ya lo corrige.

## Cómo re-verificar

```bash
# 1. Sin sesión, el panel rebota
curl -s -o /dev/null -w "%{http_code} → %{redirect_url}\n" http://localhost:4321/admin

# 2. La base no entrega datos sensibles
URL=$(grep PUBLIC_SUPABASE_URL .env | cut -d= -f2-)
KEY=$(grep PUBLIC_SUPABASE_ANON_KEY .env | cut -d= -f2-)
curl -s "$URL/rest/v1/quotes?select=nombre" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
# esperado: []
```

## Related

- [[Decisiones]]