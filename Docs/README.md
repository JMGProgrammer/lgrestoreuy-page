# Cliente Restauración Muebles & Antigüedades — Stack & Overview

**Fecha:** 2026-10-13
**Estado:** Fase 0 cerrada — especificación lista para arrancar el MVP
**País:** Uruguay (UYU, .uy, DAC/Correo Uruguayo, DGI)
**Decisiones vigentes:** `12-decisiones-mvp-sin-mp.md` — **MVP sin Mercado Pago** + **servicios/precios/fotos se cargan desde `/admin`** (sugerencia del cliente, aprobada)
**Desafío principal:** Mercado Pago queda para Fase 2 (guía congelada en `11-mercado-pago-desde-cero.md`)

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
| `10-modelo-relacional.md` | Modelo relacional planteado (ER, estados, índices, RLS) — sin migrar |
| `11-mercado-pago-desde-cero.md` | Guía MP paso a paso primera vez — **congelada, es Fase 2** |
| `12-decisiones-mvp-sin-mp.md` | **Vigente** — MVP sin MP + contenido cargado desde el panel admin |

## Cómo usar esto

1. `02`–`04` ya están respondidos (ver `07-respuestas-cuestionario.md`): no hace falta repetir el levantamiento.
2. `05-cuestionario-mercado-pago.md` queda **congelado**: se responde recién cuando se abra la Fase 2.
3. Para construir hoy, la referencia es: `08-definicion-final.md` + `09-panel-admin.md` + `10-modelo-relacional.md`, siempre con las salvedades de `12`.

## Resumen en 30 segundos

Página para taller que restaura muebles y vende antigüedades. Necesita:
- Mostrar trabajos (antes/después) → genera confianza.
- Explicar servicios y precios → filtra curiosos.
- Cotizar por formulario guiado → llega al taller por WhatsApp/email.
- Vitrina de piezas propias en venta (consulta por WhatsApp por ahora).

**El cliente se autogestiona:** servicios, precios, fotos y textos del sitio se cargan desde `/admin`, no se los pide a nadie.

Stack cerrado: **Astro + Tailwind (vintage retro) + Supabase (DB, Storage, Auth) + panel admin propio + WhatsApp + Vercel + dominio .uy.** Mercado Pago entra en Fase 2.

Detalle completo en `01-stack-propuesto.md` y `08-definicion-final.md`.

## Siguiente paso inmediato

1. Cablear Supabase y aplicar las migraciones del MVP (`profiles`, `services`, `pieces`, `gallery_items`, `quotes` + Storage).
2. Montar el tema vintage + layout base.
3. `/admin` primero (servicios, piezas, galería, contenido), después las páginas públicas.
