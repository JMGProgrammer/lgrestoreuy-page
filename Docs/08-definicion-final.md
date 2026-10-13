# 08 — Definición Final Stack + Plan (post-cuestionario)

**Fecha:** 2026-10-09 — basado en tus respuestas motor cuestionario.
**Actualizado:** 2026-10-13 — ver `12-decisiones-mvp-sin-mp.md`, que pisa lo de Mercado Pago y el origen del contenido.

## Stack cerrado
- **Frontend:** Astro + Tailwind, estilo vintage retro (serif clásica + patinas + marrón/dorado envejecido)
- **Backend/DB:** Supabase (tablas: `profiles`, `services`, `pieces`, `quotes`, `gallery_items`, `site_settings`, Storage para fotos antes/después)
- **Panel admin:** `/admin` con Auth email+clave, dashboard + CRUD servicios + piezas + galería + contenido (detalle en `09-panel-admin.md`) — **es parte del MVP**: el cliente carga ahí servicios, precios y fotos
- **Contenido:** servicios, precios, fotos y textos se administran desde el panel, no se hardcodean
- **Pagos:** **fuera del MVP.** Mientras tanto cobra con links manuales de Mercado Pago o transferencia por WhatsApp. Checkout Pro + webhook en Fase 2 (guía en `11-mercado-pago-desde-cero.md`)
- **Contacto:** WhatsApp flotante + formulario cotizador guiado → Supabase + aviso WhatsApp
- **Hosting:** Vercel + Supabase free tier, dominio .uy Nic Uruguay
- **Mantención:** plan mensual (tú subes galería/piezas)

## Páginas MVP ajustadas (sin pago, sin carrito)
```
/ → hero vintage + antes/después slider + servicios (desde DB) + CTA cotizar
/servicios → lustre, pintura, restauración antigüedades + rangos precio (CRUD en admin)
/piezas → vitrina piezas propias restauradas (ficha + fotos + botón WhatsApp)
/piezas/:slug → detalle + fotos + "Consultar por WhatsApp"
/cotizar → 4 pasos + upload 5 fotos + comuna retiro
/nosotros → taller, proceso 4 pasos, garantía (texto editable en admin)
/contacto → mapa, horarios, WhatsApp (editable en admin)
/legal → términos, devoluciones, garantía (editable en admin)
```
Las rutas `/pagar/:id` y `/pago/exito|fallo|pendiente` quedan para Fase 2.

## Flujos
**Encargo:** cotizar guiado → tú cotizas → coordina abono/saldo por WhatsApp o link manual de MP → retiro en casa → restauras → aviso listo + saldo → entrega.
**Venta propia:** compras mueble → restauras (documentas fotos) → publicas en /piezas desde el admin → cliente consulta por WhatsApp → coordina pago y entrega/retiro.

## Tablas Supabase mínimas (MVP)
```sql
profiles(id, email, role, created_at)          -- auth admin
services(id, nombre, slug, descripcion, precio_min, precio_max, orden, activo, created_at)  -- nuevo
pieces(id, titulo, slug, descripcion, categoria, precio, estado, destacada, fotos_url[], created_at)
gallery_items(id, titulo, antes_url, despues_url, tag_servicio, destacada_home, orden, created_at)
quotes(id, nombre, telefono, comuna, tipo_mueble, servicio, medidas, descripcion, fotos_url[], estado, monto_cotizado, created_at)
site_settings(id=1, whatsapp, email, direccion, horarios, mapa_url, instagram, facebook, textos...)  -- nuevo
```
`orders` y las columnas `mp_*` quedan **preparadas pero sin migrar** hasta la Fase 2 (ver `10` §3).

## Endpoints MP (Fase 2, no se implementan ahora)
- `POST /api/mercadopago/preference` → crea preferencia con titulo, precio, back_urls
- `POST /api/mercadopago/webhook` → valida x-signature, actualiza orders, dispara WhatsApp
- Credenciales: `MP_PUBLIC_KEY`, `MP_ACCESS_TOKEN` (TEST primero, luego PROD)

## Riesgos activos
1. **Pocas fotos:** ya no bloquea — el sitio arranca con contenido semilla y el cliente carga desde `/admin`. Queda como deuda de contenido.
2. **Sin tienda pero con venta:** vitrina + consulta por WhatsApp. Cuando sume MP, cada ficha pasa a tener botón de pago.
3. **Retiros a domicilio:** definir costo/km y evaluación cobrada o no.
4. **Autogestión:** si el cliente no usa el panel, la página se queda sin contenido → capacitación + contenido semilla obligatorio en la entrega.

## Siguiente paso
1. Migraciones Supabase del MVP + tema vintage.
2. `/admin` (servicios, piezas, galería, contenido, cotizaciones).
3. Páginas públicas leyendo de Supabase + cotizador 4 pasos.
4. Fase 2: reunión MP + credenciales TEST + Checkout Pro.
