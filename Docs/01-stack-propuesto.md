# 01 — Stack Propuesto (detallado)

> Esto fue propuesta inicial. **Cerrado el 2026-10-13** en `08-definicion-final.md` + `12-decisiones-mvp-sin-mp.md`.
> Resumen de lo cerrado: **Opción A sin pagos** — Astro + Tailwind + Supabase + panel admin propio + WhatsApp + Vercel. Mercado Pago pasa a Fase 2.

## Opción A — **ELEGIDA**: MVP sin MP, con panel admin (vigente)

**Ideal si:** el foco es mostrar trabajos + cotizar + que el cliente se autogestione servicios, precios y fotos.

| Capa | Tecnología | Por qué |
|------|------------|---------|
| Frontend | **Astro + Tailwind CSS** | Rapidísimo, SEO excelente, perfecto para galería. Más barato de hostear que Next. |
| Alternativa Frontend | Next.js (App Router) | Si habrá tienda con carrito y panel más dinámico, Next escala mejor. |
| Formularios / DB ligera | **Supabase (Postgres + Storage + Auth)** | DB, fotos del cotizador **y** panel admin, sin backend propio. Gratis al inicio. |
| Pagos | **Ninguno en el MVP** | El cliente cobra con links manuales de MP o transferencia. Checkout Pro en Fase 2. |
| Contacto | WhatsApp API / link + formulario a email | Lo que ya usa el cliente, cero fricción. |
| Mapas / SEO local | Google Maps embed + schema.org LocalBusiness | Para "restauración muebles + ciudad". |
| Hosting | **Vercel (frontend) + Supabase (backend)** | Deploy gratis/muy barato, SSL gratis, rápido en Uruguay. |
| Dominio / Email | Nic Uruguay (.uy) + Google Workspace o Zoho | .uy da confianza local. |
| Analytics | Plausible o GA4 | Medir cotizaciones. |

**Costo mensual estimado:** $0–600 UYU/mes al inicio (dominio .uy aparte, ver tarifa vigente en nic.uy). Sin pagos en el MVP, no hay comisión todavía; cuando entre MP cobra comisión por transacción (varía por medio — confirmar en el panel de MP, no asumo %).

**Pros:** rápido de construir, SEO top, cliente se autogestiona el contenido, mantención mínima.
**Contras:** el admin es la parte más larga del MVP; y si la tienda crece a 200+ productos con variantes, conviene migrar a Next.js completo o Shopify.

---

## Opción B — Tienda completa (si vende muchas antigüedades)

| Capa | Tecnología |
|------|------------|
| Frontend + Tienda | Next.js + Tailwind + Supabase o **Shopify Starter** |
| Pagos | Mercado Pago Checkout API (embebido) + Checkout Pro fallback |
| Admin | Panel Supabase / Shopify admin (el cliente sube productos solo) |
| Despacho | Módulo de retiro en taller / despacho por pagar / DAC/Correo Uruguayo manual |

**Cuándo elegirla:** si en cuestionario 04 marca "quiero vender antigüedades online con stock y despacho". Suma 2–3 semanas y más costo.

---

## Opción C — No-code rápido (si el presupuesto es muy bajo)

**WordPress + WooCommerce + plugin Mercado Pago + Elementor.**
Pros: barato, el cliente ya lo conoce, plugin MP oficial.
Contras: más lento, más mantención/seguridad, peor rendimiento en galerías pesadas.

> Pregunta 4.8 del cuestionario de funcionalidades define A vs B vs C.

---

## Detalle Mercado Pago (resumen técnico — **Fase 2, no es parte del MVP**)

> Congelado el 2026-10-13. Se conserva como referencia para cuando se abra la Fase 2 (`12-decisiones-mvp-sin-mp.md`). En el MVP el cliente usa links manuales de MP.

Mercado Pago ofrece 3 formas de cobrar. Recomendación para Fase 2: empezar por 1, escalar a 2.

1. **Links de pago / Point:** sin código. El cliente los crea desde su panel MP. Sirve para abonos manuales. Ideal día 1.
2. **Checkout Pro:** redirige al checkout de MP. Integración simple (SDK en Node). Soporta tarjetas, débito, transferencias, cuotas, Mercado Créditos. Requiere `Access Token` + `Webhook` para confirmar.
3. **Checkout API (Bricks):** checkout embebido en tu página (tarjeta sin salir del sitio). Mejor conversión, más código + PCI básico + validaciones.

**Flujo Fase 2:**
```
Cotización aprobada → se genera orden ($X abono) → botón "Pagar abono con Mercado Pago"
→ Checkout Pro → webhook /payments → Supabase marca orden como "pagada" → WhatsApp avisa al taller
```

**Requerimientos técnicos MP:**
- Cuenta Mercado Pago verificada (RUT + cuenta bancaria)
- Credenciales TEST + PROD (Public Key + Access Token)
- Webhook HTTPS público (`/api/mercadopago/webhook`) que valide firma `x-signature`
- Páginas `success / failure / pending` + política de devolución visible

Detalle y preguntas al cliente en `05-cuestionario-mercado-pago.md`.

---

## Estructura de páginas (vigente)

```
/ (home: hero antes/después + servicios desde DB + prueba social + CTA cotizar)
/servicios (desde tabla services — CRUD en /admin/servicios)
/piezas + /piezas/:slug (vitrina, ficha con botón WhatsApp)
/galeria (antes/después, filtrable)
/cotizar (paso 1: tipo mueble → paso 2: servicio → paso 3: fotos + medidas → paso 4: datos + comuna)
/nosotros (taller, proceso en 4 pasos, garantías — texto editable en /admin/contenido)
/contacto (mapa, horarios, WhatsApp, formulario)
/legal (términos, devoluciones, garantías)
/admin/* (login, dashboard, servicios, piezas, cotizaciones, galeria, contenido)

Fase 2: /pagar/:id, /pago/exito|fallo|pendiente
Fase 3: /tienda (listado + ficha + carrito)
```

## Decisiones — resueltas el 2026-10-13
- [x] Astro vs Next.js → **Astro** (sin carrito en el MVP; se revisa si aparece tienda grande)
- [x] Supabase vs solo formularios → **Supabase** (además de DB, sostiene el panel admin)
- [x] Panel admin autogestionable sí/no → **sí, es núcleo del MVP** (ver `09-panel-admin.md`)
- [x] Checkout Pro vs Links simples → **ninguno en el MVP**; el cliente cobra con links manuales. Fase 2: Links primero, Checkout Pro después
