# 05 — Cuestionario 4: Mercado Pago (el desafío)

> Mercado Pago SÍ sirve para Chile. Cobra comisión por venta (~2.9–3.5% + IVA aprox según medio — verificar tarifa vigente). El dinero llega a su cuenta MP y de ahí a su banco. Sin esto respondido no se puede integrar pagos.

## 4.1 Estado de cuenta (bloqueante)
- [ ] A) Ya tiene cuenta Mercado Pago verificada (puede recibir pagos)
- [ ] B) Tiene cuenta pero no verificada / no sabe
- [ ] C) No tiene → hay que crearla juntos (15 min + validación identidad + cuenta bancaria)
- ✏️ Email de la cuenta MP: _______________
- ✏️ RUT asociado: _______________

## 4.2 Qué quiere cobrar online (múltiple — define el flujo)
- [ ] A) Abono/reserva para entrar a taller (ej. 30% o $30.000 fijo)
- [ ] B) Pago total de antigüedades en tienda
- [ ] C) Saldo contra entrega (segundo pago con link)
- [ ] D) Evaluación/visita a domicilio
- [ ] E) Solo links manuales por WhatsApp (sin integración en la web por ahora)
- ✏️ Monto abono tentativa: $_______________ o ____%
- ✏️ Política si el cliente se arrepiente: [ ] No se devuelve [ ] Se devuelve menos costo evaluación [ ] Otra ✏️ ____

## 4.3 Modalidad de integración (elegir una — explícale simple)
- [ ] **A) Links de pago manuales (recomendado para partir)** — Él los crea en MP, tú pones botones "Pagar abono" en la web. 0 código, funciona día 1. Contra: conciliación manual.
- [ ] **B) Checkout Pro (recomendado MVP integrado)** — Botón en la web → redirige a Mercado Pago → paga → vuelve a la web. Soporta tarjetas, débito, transferencia, cuotas. Requiere desarrollo + webhook.
- [ ] **C) Checkout API/Bricks (fase 2)** — Paga sin salir de la página. Mejor conversión, más desarrollo y validaciones.
- [ ] D) No sabe → tú decides (sugerido: A ahora, B en 2–3 semanas)

## 4.4 Medios que quiere aceptar (múltiple)
- [ ] Tarjeta crédito (cuotas)
- [ ] Tarjeta débito / prepago
- [ ] Transferencia / PSE / cuenta MP
- [ ] Efectivo vía red de pago (si aplica en su país)
- [ ] Mercado Créditos (cuotas sin tarjeta — lo ofrece MP)
- ✏️ ¿Permite cuotas? ¿Hasta cuántas? ¿Quién asume interés? _______________

## 4.5 Datos técnicos (los pide el desarrollador)
- [ ] Puede entregar/crear credenciales TEST + PROD: `Public Key` + `Access Token` ([ ] Sí [ ] Necesita ayuda)
- [ ] Autoriza crear webhook en su cuenta + usuario test para probar pagos sin cobrar real ([ ] Sí [ ] No)
- [ ] Tiene logo + nombre de tienda para mostrar en el checkout de MP ([ ] Sí [ ] No)
- URLs de retorno (las defines tú, solo para que sepa):
  - `.../pago/exito` / `.../pago/fallo` / `.../pago/pendiente`
  - Webhook: `.../api/mercadopago/webhook`

## 4.6 Devoluciones y disputas (obligatorio para publicar)
- ✏️ ¿En qué plazo acepta devolución de antigüedad? ____ días
- ✏️ ¿Quién paga el flete de devolución? _______________
- ✏️ Garantía restauración (meses + qué cubre): _______________
- [ ] Acepta publicar Términos + Política de devolución en la web ([ ] Sí — obligatorio para MP)

## 4.7 Conciliación / operación diaria
- [ ] A) Revisa pagos en panel MP + WhatsApp (manual, sirve al inicio)
- [ ] B) Quiere panel en su web: órdenes pagadas/pendientes/fallidas + botón reenviar link (requiere Supabase + webhook)
- ✏️ ¿Quién concilia? _______________ ¿Cada cuánto? _______________
- ✏️ Cuenta bancaria para retiros MP (banco/tipo/n°): _______________

## 4.8 Checklist de desbloqueo Mercado Pago
- [ ] Cuenta creada y verificada
- [ ] Credenciales TEST generadas
- [ ] 1 pago de prueba aprobado + 1 rechazado + 1 pendiente
- [ ] Webhook recibe notificaciones y valida firma
- [ ] Credenciales PROD + primer cobro real de bajo monto ($1.000)
- [ ] Términos y devoluciones publicados

> Si 4.1 = B o C, el primer paso NO es código: es crear/verificar la cuenta MP en reunión de 30 min con carnet + cuenta bancaria a mano.
