# Cliente Restauración Muebles & Antigüedades — Stack & Overview

**Fecha:** 2026-10-09
**Estado:** Fase 0 — Levantamiento por cuestionario
**Desafío principal:** Integrar métodos de pago (Mercado Pago)

## Qué hay en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| `00-overview.md` | Overview del proyecto, objetivos, alcance |
| `01-stack-propuesto.md` | Stack técnico propuesto + 2 alternativas |
| `02-cuestionario-negocio.md` | Cuestionario 1: Negocio, clientes, zona, precios |
| `03-cuestionario-diseno-contenido.md` | Cuestionario 2: Diseño, estilo, fotos, textos, logo |
| `04-cuestionario-funcionalidades.md` | Cuestionario 3: Páginas, funcionalidades, cotizador, reservas |
| `05-cuestionario-mercado-pago.md` | Cuestionario 4: Todo lo necesario para Mercado Pago |
| `06-roadmap-next-steps.md` | Roadmap, estimaciones y qué pasa después del cuestionario |
| `07-respuestas-cuestionario.md` | Respuestas dadas en motor OpenCode 2026-10-09 |
| `08-definicion-final.md` | Stack cerrado + páginas + tablas + endpoints MP |
| `09-panel-admin.md` | Panel admin: dashboard, CRUD piezas, RLS, flujos |

## Cómo usar esto

1. Envía/le los cuestionarios 02 al 05 al cliente (o respóndelos tú en reunión).
2. Cada pregunta es **múltiple opción** — puede marcar con `X` más de una si aplica.
3. Cuando estén respondidos, volvemos y cerramos: stack final + cotización + maqueta.

## Resumen en 30 segundos

Página para taller que restaura muebles y vende/antigüedades. Necesita:
- Mostrar trabajos (antes/después) → genera confianza.
- Explicar servicios y precios → filtra curiosos.
- Cotizar / reservar / abonar online → **aquí entra Mercado Pago.**
- Posible tienda pequeña para antigüedades.

Stack tentativo (a confirmar con cuestionario): **Astro o Next.js + Tailwind + Supabase + Mercado Pago Checkout Pro + WhatsApp + hosting Vercel.**
Detalle completo en `01-stack-propuesto.md`.

## Siguiente paso inmediato

Responder `02-cuestionario-negocio.md` primero. Sin eso no se puede definir pagos ni precios.
