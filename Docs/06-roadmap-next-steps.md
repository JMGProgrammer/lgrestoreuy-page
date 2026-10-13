# 06 — Roadmap y Next Steps

> Actualizado 2026-10-13 según `12-decisiones-mvp-sin-mp.md` (sugerencia del cliente, aprobada): **MVP sin Mercado Pago** y **contenido cargado desde `/admin`**.

## Fase 0 — Levantamiento ✅ cerrada (2026-10-09 → 2026-10-13)
- [x] Cuestionarios 02–04 respondidos (ver `07-respuestas-cuestionario.md`)
- [x] Stack cerrado: Astro + Tailwind + Supabase + admin propio
- [x] Alcance cerrado: MVP **sin MP**, contenido desde `/admin` (propuesto por el cliente)
- [x] Modelo relacional y panel admin planteados (`09`, `10`)
- [ ] Acordar la cotización del alcance con el cliente (el MVP ya está definido)

## Fase 1 — MVP sin MP (2–3 semanas estimado)
1. Proyecto Astro + Tailwind con tema vintage (tokens de color, tipografía, textura sutil)
2. Migraciones Supabase del MVP: `profiles`, `services`, `site_settings`, `pieces`, `gallery_items`, `quotes` + buckets Storage + RLS
3. **Panel admin primero** (es la fuente del contenido): login, servicios, piezas, galería, contenido, cotizaciones, dashboard
4. Páginas públicas leyendo de Supabase: `/`, `/servicios`, `/piezas`, `/piezas/:slug`, `/cotizar`, `/nosotros`, `/contacto`, `/legal`
5. Cotizador 4 pasos + upload de fotos + aviso por WhatsApp
6. Contenido semilla (3–5 servicios, 4–6 piezas demo, slider antes/después de ejemplo) para que se vea bien en la primera reunión
7. SEO básico + Analytics + dominio .uy + SSL + deployment en Vercel
8. Capacitación en video 20 min: cómo cargar servicios, precios y fotos

## Fase 2 — Pagos + automatización (2–3 semanas, cuando el cliente lo pida)
1. Reunión 30 min MP: crear/verificar credenciales TEST + PROD (`11-mercado-pago-desde-cero.md`)
2. Migración de `orders` + columnas `mp_*` (ya están desenhadas, solo aplicar)
3. Checkout Pro por pieza (`/pagar/:id`) + webhook `/api/mercadopago/webhook` + páginas `/pago/exito|fallo|pendiente`
4. Botón "Generar link MP abono" en `/admin/cotizaciones/:id`
5. Avisos automáticos de WhatsApp (cotización recibida, trabajo listo) + solicitud de reseña
6. Facturación DGI (proyecto aparte, no lo hace MP)

## Fase 3 — Tienda (solo si hace falta)
- Catálogo con stock, carrito, despacho a todo Uruguay, cuentas de cliente para seguir el estado de su restauración.

## Estimación honesta (a afinar con el alcance visual final)
- MVP sin MP: **más rápido y barato** que con MP — no hay webhooks, ni estados de pago, ni pruebas de transacción.
- Lo que se paga ahora: el panel admin (auth + RLS + CRUD + Storage) es **más trabajo que el checkout**, pero es lo que el cliente necesita para.autoatenderse.
- Costo mensual estimado: $0–600 UYU/mes al inicio (dominio .uy aparte, ver tarifa vigente en nic.uy). Mercado Pago (cuando entre) cobra comisión por transacción — verificar tarifa vigente en el panel de MP, no asumo %.
- Mantención: plan mensual (ver `04` §3.7) o por evento.

## Qué se puede decir del Mercado Pago si pregunta
> "Sí, Mercado Pago te sirve en Uruguay y la cuenta ya está verificada. Vamos a publicar primero la web con catálogo, galería y cotizador, que es lo que te trae clientes. Mientras tanto cobrás con los links de Mercado Pago que ya usás, como hoy. Cuando tenga clientes entrando y los turnos llenos, ahí integramos el botón de pago para que la página te cobre sola. La comisión la cobra Mercado Pago por cada venta, no es costo mío."

## Próxima acción tuya
1. Cerrar la cotización del MVP con el cliente (alcance ya definido).
2. Arranco por las migraciones de Supabase + el panel admin.
3. Mientras tanto definimos juntos el tema vintage (tipografía, paleta, textura) para el primer wireframe.