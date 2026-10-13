# 12 — Decisiones de alcance: MVP sin Mercado Pago + contenido desde admin

**Fecha:** 2026-10-13
**Origen:** sugerencia del cliente, aprobada.
**Estado:** vigente — pisa a lo definido en `08-definicion-final.md` (2026-10-09) donde se contradiga.

## Decisión 1 — Servicios, precios y fotos los carga el cliente desde `/admin`

- Servicios (nombre, descripción, rango de precio), precios de piezas y fotos **antes/después** se ingresan **desde el panel administrador**, por el propio cliente.
- **No son un insumo de diseño ni un bloqueante del arranque.** No pido pack de 20-30 fotos ni lista de precios antes de construir.
- El sitio **arranca con contenido semilla** (demo) para que se vea bien en la primera reunión; el cliente va reemplazando desde `/admin`.
- Consecuencias técnicas:
  - `/admin` **deja de ser "Fase 2" y pasa a ser parte del MVP**: es la fuente de contenido, sin él la página queda muda.
  - `/servicios` y `/piezas` se renderizan **desde Supabase**, no desde archivos estáticos. Todo el copy del sitio (WhatsApp, dirección, horarios, textos de nosotros, redes) también pasa a ser editable desde `/admin/contenido`.
  - El cuestionario de diseño/contenido (`03`) queda reducido a **estilo visual + logo/redes**. Fotos y precios ya no se preguntan ahí (ver `03`).
  - El riesgo "faltan fotos" (`00` §5) baja de bloqueante a **deuda de contenido post-entrega**: la web se publica igual y el cliente la va llenando.

## Decisión 2 — MVP sin Mercado Pago

- El MVP **no incluye** Mercado Pago: ni Checkout Pro, ni webhook, ni páginas de pago, ni `orders`.
- En el MVP el cobro es **por fuera**: el cliente manda links manuales de Mercado Pago o coordina por WhatsApp/transferencia, exactamente como hoy.
- `05-cuestionario-mercado-pago.md` y `11-mercado-pago-desde-cero.md` quedan **congelados para Fase 2**. No se piden credenciales TEST ni reunión de MP para arrancar.
- El modelo de datos deja `orders` + campos `mp_*` **preparados pero sin migrar** (ver `10` §3 y `09` §3), así agregar MP después es agregar tabla, no rediseñar.

## Alcance MVP resultante (el "MVP sin MP")

| Página pública | Fuente de datos |
|---|---|
| `/` | hero + slider antes/después + destacados (`gallery_items`, `pieces`) |
| `/servicios` | tabla `services` (CRUD en admin) |
| `/piezas` + `/piezas/:slug` | tabla `pieces` (`estado=disponible`) |
| `/cotizar` | 4 pasos → tabla `quotes` + Storage |
| `/nosotros` | `/admin/contenido` (proceso, historia, garantía) |
| `/contacto` | `/admin/contenido` (mapa, horarios, WhatsApp) |
| `/legal` | `/admin/contenido` (términos, devoluciones) |

| Admin | Qué hace |
|---|---|
| `/admin/login` | Supabase Auth email + clave |
| `/admin` | dashboard: piezas, cotizaciones, galleries |
| `/admin/servicios` | **nuevo** — CRUD servicios + rango de precio + orden |
| `/admin/piezas` | CRUD piezas: precio, fotos, estado, destacada |
| `/admin/galeria` | pares antes/después, destacadas del hero |
| `/admin/cotizaciones` | ver / cotizar / cambiar estado / WhatsApp prellenado |
| `/admin/contenido` | **nuevo** — WhatsApp, dirección, horarios, redes, textos, mapa |

## Lo que NO entra al MVP (Fase 2)

- Mercado Pago: Checkout Pro, webhook, `/pagar/:id`, `/pago/exito|fallo|pendiente`, tabla `orders`.
- Carrito / tienda con stock.
- Cuentas de cliente para seguir el estado de su restauración.
- Agenda de retiros, facturación DGI, automatismos de WhatsApp.

## Impacto en esfuerzo

- Admin pasa de "+40% sobre el MVP" a **parte núcleo del MVP** → el MVP crece en auth + RLS + CRUD servicios/piezas/galería/contenido + dashboard + Storage.
- Se **quita** del MVP: preferencia + webhook + páginas de retorno + tests de pago (la parte más delicada de todo el proyecto).
- Resultado neto: MVP **más grande en contenido, más chico en integración** → menos riesgo de bloquearse con MP y más rápido para ver la web funcionando.
- La cotización del `06` se recalcula cuando se defina el alcance visual final.

## Impacto en Supabase (resumen)

- **Entra al MVP:** `profiles`, `services` (nueva), `pieces`, `gallery_items`, `quotes` + Storage para fotos.
- **Entra al MVP:** `site_settings` (nueva, una fila) para los datos del taller que edita el cliente.
- **Queda para Fase 2:** `orders`, columnas `mp_*` de `pieces`/`quotes`.