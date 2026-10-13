# 04 — Cuestionario 3: Funcionalidades y Páginas

> **Actualizado 2026-10-13** (`12-decisiones-mvp-sin-mp.md`): el **panel admin es parte del MVP** (respuesta a 3.4 = B) y el MVP **arranca sin Mercado Pago** (secciones 3.5 y 3.6 pasan a Fase 2).

## 3.1 Cotizador (corazón de la página)
¿Cómo quiere recibir cotizaciones?
- [ ] A) Formulario simple (nombre, teléfono, fotos, descripción) → le llega a WhatsApp/email
- [ ] B) Cotizador guiado por pasos (recomendado):
  - Paso 1: tipo de mueble [silla/mesa/cómoda/sofá/antigüedad/otro]
  - Paso 2: servicio [estructura/tapiz/lustre/completo]
  - Paso 3: medidas + fotos (hasta 5) + urgencia
  - Paso 4: datos + comuna (para retiro/despacho)
- [ ] C) Cotizador con precio automático por rangos (ej. silla tapiz $X–$Y)
- [ ] D) Solo botón WhatsApp, sin formulario
- ✏️ ¿ cobra visita/evaluación a domicilio? Monto: $____ ¿Se descuenta si acepta? [ ] Sí [ ] No

## 3.2 Reservas y agenda
- [ ] A) No necesita agenda, basta WhatsApp
- [ ] B) Calendario simple para agendar evaluación/retiro (elige día/bloque)
- [ ] C) Agenda con recordatorio por WhatsApp/email
- ✏️ Horario taller: _______________ Días: _______________

## 3.3 Tienda de antigüedades (define stack A vs B)
- [ ] A) No vende online, solo muestra trabajos (más simple y barato)
- [x] B) Vitrina sin pago (muestra piezas, consulta por WhatsApp) — **elegido para el MVP**
- [ ] C) Tienda pequeña con pago online (hasta ~50 productos, stock, despacho/retiro) — Fase 2/3
- [ ] D) Tienda completa (categorías, buscador, cupones, despacho a todo Uruguay) — Fase 3
- Si C o D → ✏️ ¿Quién sube productos? [ ] Él [ ] Tú [ ] Ambos → **él, desde `/admin/piezas`**
- Si C o D → ✏️ Despacho: [ ] Retiro en taller [ ] Flete propio [ ] DAC/Correo Uruguayo [ ] Por pagar

## 3.4 Cuentas y panel admin — **parte del MVP**
- [ ] A) Sin cuentas, todo por WhatsApp/formulario (MVP más rápido)
- [x] B) Panel simple para ÉL: servicios + precios + fotos + galería + cotizaciones — **elegido**
- [ ] C) Cuentas para clientes (ver estado de su restauración) — Fase 2
- Motivo: es la única forma de que el cliente cargue contenido sin llamarte. Detalle en `09-panel-admin.md`.

## 3.5 Comunicación automática — Fase 2
- [ ] Confirmación de cotización recibida (email/WhatsApp)
- [ ] Aviso "tu abono fue recibido, tu trabajo entra a cola" (requiere MP)
- [ ] Aviso "tu mueble está listo, coordinamos el saldo" — se puede hacer sin MP
- [ ] Reseña post-entrega (pedir review Google)

## 3.6 Extras / integraciones (múltiple)
- [ ] Reseñas Google incrustadas
- [ ] Instagram feed automático
- [ ] Mapa Google + cómo llegar + estacionamiento
- [ ] Factura DGI (ojo: es integración aparte, no la hace MP)
- [ ] Mercado Pago (Checkout Pro) — **Fase 2**, ver `05` y `11`
- [ ] Otro medio (transferencia / PayPal) como 2do medio: [ ] Sí [ ] No
- [ ] Píxel Meta + GA4 para anuncios: [ ] Sí [ ] No [ ] Más adelante

## 3.7 Mantención post-entrega
- [ ] A) Él actualiza todo solo (necesita panel + capacitación en video)
- [ ] B) Plan mensual contigo (subir galería/productos, respaldo, cambios menores)
- [ ] C) Por evento (te llama cuando necesita algo)
- ✏️ Presupuesto mensual mantención estimado: $_______________
