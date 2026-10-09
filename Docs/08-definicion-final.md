# 08 — Definición Final Stack + Plan (post-cuestionario)

**Fecha:** 2026-10-09 — basado en tus respuestas motor cuestionario.

## Stack cerrado
- **Frontend:** Astro + Tailwind, estilo vintage retro (serif clásica + patinas + marrón/dorado envejecido)
- **Backend/DB:** Supabase (tablas: `profiles`, `pieces`, `quotes`, `orders`, Storage para fotos antes/después)
- **Panel admin:** `/admin` con Auth email+clave, dashboard + CRUD piezas + cotizaciones + órdenes (detalle en `09-panel-admin.md`)
- **Pagos:** Mercado Pago cuenta verificada
  - Día 1: Links de pago manuales para piezas únicas
  - MVP: Checkout Pro por pieza (`/pagar/:id`) + webhook `/api/mercadopago/webhook` + páginas exito/fallo/pendiente
- **Contacto:** WhatsApp flotante + formulario cotizador guiado → Supabase + aviso WhatsApp
- **Hosting:** Vercel + Supabase free tier, dominio .uy Nic Uruguay
- **Mantención:** plan mensual (tú subes galería/piezas)

## Páginas MVP ajustadas (sin carrito, con vitrina pagable)
```
/ → hero vintage + antes/después slider + servicios lustre/pintura/antigüedades + CTA cotizar
/servicios → lustre, pintura, restauración antigüedades + rangos precio
/piezas → vitrina piezas propias restauradas (ficha + fotos + botón Pagar total con MP)
/cotizar → 4 pasos + upload 5 fotos + comuna retiro
/nosotros → taller, proceso 4 pasos, garantía
/contacto → mapa, horarios, WhatsApp
/pagar/:id → Checkout Pro
/pago/exito|fallo|pendiente
/legal → términos, devoluciones, garantía
```

## Flujos
**Encargo:** cotizar guiado → tú cotizas → envías link abono MP por WhatsApp → retiro en casa → restauras → aviso listo + link saldo → entrega.
**Venta propia:** compras mueble → restauras (documentas fotos, pocas hoy → exigir) → publicas en /piezas → cliente paga total MP → coordinan entrega/retiro.

## Tablas Supabase mínimas
```sql
quotes(id, nombre, telefono, comuna, tipo_mueble, servicio, medidas, descripcion, fotos_url[], estado, created_at)
pieces(id, titulo, descripcion, precio, fotos_url[], estado[disponible|reservada|vendida], created_at)
orders(id, piece_id?, quote_id?, monto, mp_preference_id, mp_payment_id, estado[pte|pagada|fallida], created_at)
```

## Endpoints MP
- `POST /api/mercadopago/preference` → crea preferencia con titulo, precio, back_urls
- `POST /api/mercadopago/webhook` → valida x-signature, actualiza orders, dispara WhatsApp
- Credenciales: `MP_PUBLIC_KEY`, `MP_ACCESS_TOKEN` (TEST primero, luego PROD)

## Riesgos activos
1. Pocas fotos → pedir pack 20-30 antes/después + autorizaciones, o cotizar sesión.
2. Sin tienda pero con venta → educar que vitrina pagable es suficiente por ahora.
3. Retiros a domicilio → definir costo/km y evaluación cobrada o no.

## Siguiente paso
1. Reunión 30 min MP: generar credenciales TEST, probar $1.000, validar webhook.
2. Pedir pack fotos + lista 5-10 piezas con precio + rangos servicio.
3. Wireframe vintage + cotizador 4 pasos.
