# 01 — Stack Propuesto (detallado)

> Esto es propuesta inicial. Se cierra 100% después de los cuestionarios. La idea es partir simple, barato de mantener y escalable a tienda.

## Opción A — Recomendada: Ligera + Cotizador + Mercado Pago (MVP)

**Ideal si:** el foco es mostrar trabajos + cotizar + cobrar abonos, tienda pequeña o sin tienda por ahora.

| Capa | Tecnología | Por qué |
|------|------------|---------|
| Frontend | **Astro + Tailwind CSS** | Rapidísimo, SEO excelente, perfecto para galería. Más barato de hostear que Next. |
| Alternativa Frontend | Next.js (App Router) | Si habrá tienda con carrito y panel más dinámico, Next escala mejor. |
| Formularios / DB ligera | **Supabase (Postgres + Storage)** | Guarda solicitudes de cotización, fotos, piezas en venta sin armar backend. Gratis al inicio. |
| Pagos | **Mercado Pago Checkout Pro + Links de pago** | Menos código, Mercado Pago hospeda el checkout. Soporta tarjetas, transferencia, cuotas. Webhook para confirmar pago. |
| Contacto | WhatsApp API / link + formulario a email | Lo que ya usa el cliente, cero fricción. |
| Mapas / SEO local | Google Maps embed + schema.org LocalBusiness | Para "restauración muebles + ciudad". |
| Hosting | **Vercel (frontend) + Supabase (backend)** | Deploy gratis/muy barato, SSL gratis, rápido en Chile. |
| Dominio / Email | Nic Chile (.cl) + Google Workspace o Zoho | .cl da confianza local. |
| Analytics | Plausible o GA4 + Meta Pixel | Medir cotizaciones y pagos. |

**Costo mensual estimado:** $0–15.000 CLP/mes al inicio (dominio aparte ~$10.950/año .cl). Mercado Pago cobra comisión por transacción (~3% aprox, varía por país/medio — confirmar en developer.mercadopago.cl).

**Pros:** rápido de construir (2–4 semanas MVP), SEO top, mantención mínima.
**Contras:** si la tienda crece a 200+ productos con variantes, conviene migrar a Next.js completo o Shopify.

---

## Opción B — Tienda completa (si vende muchas antigüedades)

| Capa | Tecnología |
|------|------------|
| Frontend + Tienda | Next.js + Tailwind + Supabase o **Shopify Starter** |
| Pagos | Mercado Pago Checkout API (embebido) + Checkout Pro fallback |
| Admin | Panel Supabase / Shopify admin (el cliente sube productos solo) |
| Despacho | Módulo de retiro en taller / despacho por pagar / Starken/Chilexpress manual |

**Cuándo elegirla:** si en cuestionario 04 marca "quiero vender antigüedades online con stock y despacho". Suma 2–3 semanas y más costo.

---

## Opción C — No-code rápido (si el presupuesto es muy bajo)

**WordPress + WooCommerce + plugin Mercado Pago + Elementor.**
Pros: barato, el cliente ya lo conoce, plugin MP oficial.
Contras: más lento, más mantención/seguridad, peor rendimiento en galerías pesadas.

> Pregunta 4.8 del cuestionario de funcionalidades define A vs B vs C.

---

## Detalle Mercado Pago (resumen técnico)

Mercado Pago ofrece 3 formas de cobrar. Recomendación inicial: empezar por 1, escalar a 2.

1. **Links de pago / Point:** sin código. El cliente los crea desde su panel MP. Sirve para abonos manuales. Ideal día 1.
2. **Checkout Pro:** redirige al checkout de MP. Integración simple (SDK en Node). Soporta tarjetas, débito, transferencias, cuotas, Mercado Créditos. Requiere `Access Token` + `Webhook` para confirmar.
3. **Checkout API (Bricks):** checkout embebido en tu página (tarjeta sin salir del sitio). Mejor conversión, más código + PCI básico + validaciones.

**Flujo recomendado MVP:**
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

## Estructura de páginas tentativa

```
/ (home: hero antes/después + servicios + prueba social + CTA cotizar)
/servicios (lustre, tapiz, estructura, laqueado, dorado, etc.)
/proyectos o /galeria (filtros: sillas, mesas, cómodas, antigüedades)
/nosotros (taller, proceso en 4 pasos, garantías)
/tienda (solo si Fase 2: listado + ficha producto + carrito simple)
/cotizar (paso 1: tipo mueble → paso 2: fotos + medidas → paso 3: datos → enviar)
/pagar/:id (botón Mercado Pago para abono/saldo)
/contacto (mapa, horarios, WhatsApp, formulario)
/legal (términos, devoluciones, garantías)
```

## Decisión pendiente (la define el cuestionario)
- [ ] Astro vs Next.js → depende si hay tienda real
- [ ] Supabase vs solo formularios a WhatsApp/email → depende volumen
- [ ] Checkout Pro vs Links simples para partir → depende urgencia y cuenta MP
- [ ] Panel admin autogestionable sí/no → depende si el cliente quiere subir cosas solo
