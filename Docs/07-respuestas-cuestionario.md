# 07 — Respuestas Cuestionario (motor OpenCode) — 2026-10-09

Respuestas dadas por ti en modo interactivo. Esto cierra la Fase 0.

## Resumen ejecutivo
- **Modelo negocio:** doble: 1) compra él mismo muebles/antigüedades → restaura → vende (pago total pieza), 2) restauración por encargo con **retiro en casa del cliente**.
- **Servicios foco:** antigüedades + muebles sencillos con lustre y pintura (no tapicería pesada por ahora).
- **Cotizador:** guiado por pasos (tipo mueble → servicio → medidas/fotos → datos/comuna).
- **Estilo:** vintage retro.
- **Fotos:** pocas → hay que exigir pack mínimo o sesión.
- **Stack:** Astro + Supabase.
- **Admin/mantención:** plan mensual contigo.
- **Mercado Pago:** cuenta **verificada**, objetivo **pago total pieza**. Integración aún por definir → se recomienda Links día 1 + Checkout Pro MVP.

## Contradicción detectada y resolución
Elegiste `Sin tienda` pero luego `Pago total pieza` + `venta por compra propia`.
**Resolución propuesta:** no hacer carrito completo, sino **vitrina con pago por pieza** (cada ficha tiene botón MP único). Es el punto medio: sin tienda completa pero sí cobra online. Si vende >20 piezas/mes, escalar a tienda pequeña.

## Detalle pregunta por pregunta
1. Alcance → `Sin tienda` (matizado arriba a vitrina con pago)
2. Cobro MP inicial → `Aún no lo sé` → se define Links + Checkout Pro
3. Servicios → antigüedades, muebles sencillos lustre/pintura
4. Operación → compra propia + encargo con retiro domiciliario
5. Cotizador → guiado por pasos
6. Estilo → vintage retro
7. Qué cobrar → pago total pieza
8. Cuenta MP → verificada ✅ (desbloquea desarrollo)
9. Fotos → pocas ⚠️ (riesgo principal)
10. Stack → Astro + Supabase
11. Admin → plan mensual

## Qué falta preguntar al cliente real (no a ti)
- Comuna base + cobertura retiro (km máximo)
- Ticket promedio restauración simple vs antigüedad
- Monto abono encargo (% o fijo) y política arrepentimiento
- Garantía (meses) y plazos (silla X días, etc.)
- Horarios taller + quién concilia pagos
- Instagram/FB + logo en buena calidad
- Credenciales TEST MP (Public Key + Access Token) + logo checkout
