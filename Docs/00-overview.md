# 00 — Overview del Proyecto

## 1. Quién es el cliente
Taller / persona que hace:
- Restauración de muebles (madera, tapiz, lustre, etc.)
- Restauración / venta de antigüedades y objetos decorativos
- Posiblemente: retiro y despacho a domicilio, trabajos a pedido

> **Por confirmar en cuestionario 02:** ¿Es 1 persona o taller con equipo? ¿Atiende solo su comuna/ciudad o todo Chile? ¿Vende antigüedades con stock o solo restaura lo que le llevan?

## 2. Problema que resuelve la página
Hoy probablemente consigue clientes por boca a boca / Instagram / WhatsApp, sin:
- Portafolio ordenado (las fotos se pierden en redes)
- Precios / procesos claros (le preguntan lo mismo 20 veces)
- Forma de asegurar reservas con pago (no-shows, trabajos a medias)
- Catálogo de antigüedades disponibles

## 3. Objetivos de la página (a priorizar con cliente)
1. **Confianza:** galería antes/después + testimonios + proceso de trabajo.
2. **Contacto calificado:** formulario + cotizador que filtre por tipo de mueble, medidas, fotos.
3. **Venta / reserva con pago:** abono de reserva (ej. 30-50%), pago total de piezas en venta, saldo contra entrega.
4. **SEO local:** aparecer en "restauración de muebles [ciudad]" en Google.
5. **Autonomía:** que el cliente pueda subir fotos y piezas sin llamarte cada vez.

## 4. Alcance tentativo

### MVP (Fase 1 — recomendado)
- [ ] Home + Servicios + Galería antes/después + Nosotros/Taller + Contacto
- [ ] Cotizador guiado (sin pago todavía, solo solicitud + fotos por WhatsApp/form)
- [ ] Botón Mercado Pago para **reserva/abono** (link de pago o Checkout Pro simple)
- [ ] WhatsApp flotante + formulario
- [ ] Responsive + SEO básico + Google Maps

### Fase 2 (si lo pide en cuestionario)
- [ ] Tienda de antigüedades (10-50 productos, stock, despacho)
- [ ] Pago completo online + webhooks + estados de pedido
- [ ] Panel admin para subir trabajos/productos
- [ ] Agenda de retiros / visitas a domicilio
- [ ] Facturación / boleta (SII) — fuera de Mercado Pago

### Fuera de alcance (salvo que lo pida)
- App móvil nativa
- Facturación electrónica automática
- Multi-vendedor / marketplace
- Integración con Transbank adicional (se puede, pero suma costo)

## 5. Riesgos / desafíos detectados
1. **Pagos:** Mercado Pago exige cuenta empresa/persona verificada, credenciales, webhooks, políticas de devolución. Si el cliente no tiene RUT/empresa clara, se traba. → Ver `05-cuestionario-mercado-pago.md`.
2. **Fotos:** Sin fotos buenas de antes/después, la página no vende. Hay que pedirle 20-30 fotos reales mínimo.
3. **Precios variables:** Cada restauración es distinta. No se puede poner "precio fijo" sin un cotizador por rangos. Hay que definirlo.
4. **Logística:** Retiro/despacho de muebles grandes define el costo y la zona de cobertura.
5. **Mantención:** ¿Quién actualiza galería y stock? Definir plan de mantención.

## 6. Qué necesitamos del cliente (checklist)
- [ ] Respuestas a cuestionarios 02–05
- [ ] 20–30 fotos (antes/después, taller, equipo)
- [ ] Logo / colores / Instagram / Facebook
- [ ] Lista de servicios + rangos de precio
- [ ] Datos Mercado Pago (o crear cuenta juntos)
- [ ] Textos: historia del taller, garantías, tiempos de entrega
