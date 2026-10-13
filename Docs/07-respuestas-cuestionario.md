# 07 — Respuestas Cuestionario

## Actualización 2026-10-13 (cierra la Fase 0)

Decisiones del cliente que pisan lo del 2026-10-09:

| Tema | Respuesta | Consecuencia |
|---|---|---|
| Servicios, precios, fotos | **Los carga el cliente desde `/admin`** | No se piden fotos/precios antes de arrancar; el panel deja de ser extra y pasa a ser núcleo del MVP (`09`, `12`) |
| Mercado Pago | **Fuera del MVP por ahora** | Se elimina Checkout Pro, webhook, `/pagar/:id`, `/pago/*` y `orders` del alcance actual. Fase 2. Cobro con links manuales mientras tanto |
| MVP | **Sin MP, con panel admin completo** | `/admin/servicios` y `/admin/contenido` son módulos nuevos |

Consecuencias documentadas en `12-decisiones-mvp-sin-mp.md` y reflejadas en `00`, `01`, `03`, `04`, `05`, `06`, `08`, `09`, `10` y `11`.

**Pendiente antes de empezar a codear:** que el cliente dé el ok al alcance del MVP sin MP (ver `06` Fase 0).

---

# Respuestas del 2026-10-09 (motor OpenCode)

Respuestas dadas por ti en modo interactivo. Esto cerró la Fase 0.

## Resumen ejecutivo
- **Modelo negocio:** doble: 1) compra él mismo muebles/antigüedades → restaura → vende (pago total pieza), 2) restauración por encargo con **retiro en casa del cliente**.
- **Servicios foco:** antigüedades + muebles sencillos con lustre y pintura (no tapicería pesada por ahora).
- **Cotizador:** guiado por pasos (tipo mueble → servicio → medidas/fotos → datos/comuna).
- **Estilo:** vintage retro.
- **Fotos:** pocas → hay que exigir pack mínimo o sesión.
- **Stack:** Astro + Supabase.
- **Admin/mantención:** plan mensual contigo. → **2026-10-13:** el admin pasa a ser parte del MVP y el cliente se autogestiona servicios/precios/fotos.
- **Mercado Pago:** cuenta **verificada**, objetivo **pago total pieza**. → **2026-10-13:** se posterga a Fase 2; el MVP no lo incluye.

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
- Garantía (meses) y plazos (silla X días, etc.)
- Horarios taller + quién concilia pagos
- Instagram/FB + logo en buena calidad
- ~~Monto abono encargo (% o fijo) y política arrepentimiento~~ → Fase 2 (define los links de MP)
- ~~Credenciales TEST MP (Public Key + Access Token) + logo checkout~~ → Fase 2

> Nota 2026-10-13: de esta lista, **solo el logo/redes y los datos del taller son necesarios para arrancar**. El resto se resuelve por `/admin` o pertenece a la Fase 2.
