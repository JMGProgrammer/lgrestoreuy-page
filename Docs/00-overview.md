# 00 — Overview del Proyecto

## 1. Quién es el cliente
Taller / persona que hace:
- Restauración de muebles (madera, tapiz, lustre, etc.)
- Restauración / venta de antigüedades y objetos decorativos
- Posiblemente: retiro y despacho a domicilio, trabajos a pedido

> **Por confirmar en cuestionario 02:** ¿Es 1 persona o taller con equipo? ¿Atiende solo su comuna/ciudad o todo Uruguay? ¿Vende antigüedades con stock o solo restaura lo que le llevan?

## 2. Problema que resuelve la página
Hoy probablemente consigue clientes por boca a boca / Instagram / WhatsApp, sin:
- Portafolio ordenado (las fotos se pierden en redes)
- Precios / procesos claros (le preguntan lo mismo 20 veces)
- Forma de asegurar reservas con pago (no-shows, trabajos a medias)
- Catálogo de antigüedades disponibles

## 3. Objetivos de la página (a priorizar con cliente)
1. **Confianza:** galería antes/después + testimonios + proceso de trabajo.
2. **Contacto calificado:** formulario + cotizador que filtre por tipo de mueble, medidas, fotos.
3. **Autonomía total del cliente:** cargar servicios, precios, fotos y textos sin llamarte (objetivo clave, ver `12`).
4. **SEO local:** aparecer en "restauración de muebles [ciudad]" en Google.
5. **Venta / reserva:** vitrina de piezas propias en venta. El cobro online (Checkout Pro) es Fase 2; mientras tanto sigue con links manuales.

## 4. Alcance tentativo

> Actualizado 2026-10-13 según `12-decisiones-mvp-sin-mp.md`. Los cambios de alcance (MVP sin MP, contenido desde `/admin`) son **sugerencia del cliente, aprobada**.

### MVP (Fase 1 — vigente)
- [ ] Home + Servicios + Galería antes/después + Nosotros/Taller + Contacto + Legal
- [ ] **Panel `/admin`** (auth + CRUD servicios, precios, piezas, fotos, galería, contenido, cotizaciones) — **es parte del MVP**
- [ ] Cotizador guiado (sin pago: la solicitud + fotos llegan a WhatsApp/email)
- [ ] Vitrina `/piezas` con botón de consulta por WhatsApp
- [ ] WhatsApp flotante + formulario
- [ ] Responsive + SEO básico + Google Maps
- [ ] Contenido semilla para que se vea bien en la primera reunión

### Fase 2
- [ ] Mercado Pago: Checkout Pro por pieza + webhook + páginas de retorno (guía en `11`)
- [ ] Botón "generar link de abono" desde el admin
- [ ] Avisos automáticos de WhatsApp + solicitud de reseña

### Fase 3
- [ ] Tienda de antigüedades (10-50 productos, stock, despacho)
- [ ] Cuentas de cliente para seguir su restauración
- [ ] Agenda de retiros / visitas a domicilio
- [ ] Facturación / boleta (DGI) — fuera de Mercado Pago

### Fuera de alcance (salvo que lo pida)
- App móvil nativa
- Facturación electrónica automática
- Multi-vendedor / marketplace
- Integración con otra pasarela adicional (se puede, pero suma costo)

## 5. Riesgos / desafíos detectados
1. **Pagos:** *(bajado de prioridad 2026-10-13)* el MVP arranca sin MP y el cliente cobra con links manuales. Mercado Pago sigue siendo la vía correcta, pero ya no bloquea el arranque. → ver `05`.
2. **Fotos:** no es bloqueante — el sitio se publica con contenido semilla y el cliente sube sus fotos desde `/admin`. Sigue siendo el mayor límite de conversión una vez publicada.
3. **Precios variables:** cada restauración es distinta. Se resuelve con rangos de precio por servicio (editables en `/admin/servicios`) y cotización manual.
4. **Logística:** retiro/despacho de muebles grandes define el costo y la zona de cobertura.
5. **Mantención/autogestión:** el panel existe justamente para que el cliente no dependa de vos. Si no lo usa, la web se queda sin contenido → contenido semilla + capacitación.

## 6. Qué necesitamos del cliente (checklist)
- [x] Respuestas a cuestionarios 02–04
- [x] Alcance del MVP definido (propuesto por el cliente, aprobado)
- [ ] Logo / colores / Instagram / Facebook
- [ ] Datos del taller (WhatsApp, dirección, horarios) — o los carga él en `/admin/contenido`
- [ ] Cotización acordada
- [ ] Datos Mercado Pago — **Fase 2**, no bloquea
- Todo lo demás (servicios, precios, fotos, textos) **lo carga él desde `/admin`**
