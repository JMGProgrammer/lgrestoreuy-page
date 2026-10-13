# 10 — Modelo Relacional (planteado, sin migrar aún)

> Estado: **propuesta lógica**. No hay migraciones SQL aplicadas todavía. Cuando confirmemos categorías, lo paso a migraciones Supabase.
> Todo Uruguay: moneda **UYU** (pesos uruguayos, enteros, sin decimales), dominio **.uy**, logística **DAC / Correo Uruguayo / flete propio / retiro**.
> Actualizado 2026-10-13: entran `services` y `site_settings` (contenido administrable por el cliente). `orders` + campos `mp_*` quedan **congelados para Fase 2** (ver §3 y `12-decisiones-mvp-sin-mp.md`).

## 1. Diagrama (lógica)

```mermaid
erDiagram
  PROFILES ||--o{ PIECES : publica
  PROFILES ||--o{ SERVICES : edita
  PIECES ||--o{ PIECE_PHOTOS : tiene
  QUOTES ||--o{ QUOTE_PHOTOS : adjunta
  GALLERY_ITEMS }o--|| PROFILES : curada_por

  PROFILES {
    uuid id PK
    text email UK
    text role "admin | ayudante"
    timestamptz created_at
  }
  SERVICES {
    uuid id PK
    text slug UK
    text nombre
    text descripcion
    int precio_min_uyu "nullable"
    int precio_max_uyu "nullable"
    text icono
    int orden
    boolean activo
    timestamptz created_at
    timestamptz updated_at
  }
  SITE_SETTINGS {
    smallint id PK "siempre 1"
    text nombre_taller
    text whatsapp
    text email
    text direccion
    text horarios
    text mapa_url
    text instagram
    text facebook
    text texto_nosotros
    text texto_proceso
    text texto_garantia
    text texto_legal
    timestamptz updated_at
  }
  PIECES {
    uuid id PK
    text slug UK
    text titulo
    text descripcion
    text categoria
    int precio_uyu
    int costo_compra_uyu "privado, nullable"
    text estado "por_restaurar|en_restauracion|disponible|reservada|vendida|pausada|borrador"
    boolean destacada
    text medidas
    text ubicacion
    uuid created_by FK
    timestamptz created_at
    timestamptz updated_at
  }
  PIECE_PHOTOS {
    uuid id PK
    uuid piece_id FK
    text storage_path
    text url
    text rol "general|antes|despues"
    int orden
    timestamptz created_at
  }
  QUOTES {
    uuid id PK
    text nombre
    text telefono
    text comuna_barrio "UY: barrio/localidad + depto"
    text tipo_mueble
    text servicio
    text medidas
    text descripcion
    text estado "nueva|cotizada|aceptada|en_taller|lista|entregada|rechazada"
    int monto_cotizado_uyu "lo carga el cliente en el admin"
    int monto_abono_uyu "nullable"
    timestamptz created_at
  }
  QUOTE_PHOTOS {
    uuid id PK
    uuid quote_id FK
    text storage_path
    text url
    timestamptz created_at
  }
  ORDERS {
    uuid id PK "FASE 2"
    uuid piece_id FK "nullable"
    uuid quote_id FK "nullable"
    text tipo "total_pieza|abono|saldo"
    int monto_uyu
    text nombre_comprador
    text telefono
    text email
    text mp_preference_id
    text mp_payment_id
    text mp_status
    text estado "pendiente|pagada|fallida|reembolsada"
    timestamptz created_at
  }
  GALLERY_ITEMS {
    uuid id PK
    text titulo
    text antes_url
    text despues_url
    text tag_servicio
    boolean destacada_home
    int orden
    uuid created_by FK
    timestamptz created_at
  }
```

> `PIECES.mp_preference_id` y `PIECES.mp_payment_id` no aparecen en el diagrama: son **Fase 2**, se agregan junto con la integración de Mercado Pago.

## 2. Por qué tabla de fotos separada (y no array)
- Reordenar (portada primero) sin reescribir arrays.
- Marcar rol `antes/después` para el slider.
- Borrar 1 foto sin tocar las demás.
- A futuro: alt SEO por foto.
- Si quieres partir ultra-simple, se puede usar `fotos text[]` en `pieces`, pero recomiendo tabla separada desde el día 1 (cuesta lo mismo).

## 3. Reglas de estado
- `pieces`: `por_restaurar → en_restauracion → disponible → reservada → vendida`. `pausada/borrador` son laterales (no visibles).
  - Solo `disponible` es visible en `/piezas` pública.
  - Pasar a `disponible` exige: precio_uyu > 0 + ≥1 foto rol general.
  - Webhook MP `pagada` tipo `total_pieza` → `vendida` automático. **Fase 2.**
- `services`: `orden` define la aparición en `/servicios`; `activo=false` oculta sin borrar.
- `quotes`: `nueva → cotizada → aceptada → en_taller → lista → entregada`. `rechazada` lateral.
  - Orden `abono` pagada → quote `aceptada`. Orden `saldo` pagada → `entregada`. **Fase 2.**
- `orders` nunca se borra (trazabilidad dinero). Solo cambia `estado`. **Fase 2.**

## 4. Índices recomendados (para cuando migremos)
- `services(activo, orden)`, `services(slug)`.
- `pieces(estado)`, `pieces(slug)`, `pieces(destacada)` parcial donde disponible.
- `piece_photos(piece_id, orden)`, `quote_photos(quote_id)`.
- `quotes(estado, created_at desc)`, `orders(estado, created_at desc)`, `orders(mp_payment_id)` único parcial.
- `gallery_items(destacada_home, orden)`.

## 5. RLS (resumen, SQL en migración después)
- `services` / `site_settings`: SELECT público, escritura solo admin.
- `pieces`: SELECT público solo `estado='disponible'` (+ join fotos). INSERT/UPDATE/DELETE solo admin.
- `piece_photos`: SELECT público solo si su pieza está disponible; escritura solo admin.
- `quotes` / `quote_photos`: público solo INSERT (formulario), sin SELECT. Lectura/update solo admin.
- `orders`: sin acceso público directo (se crean vía API server). Lectura solo admin. **Fase 2.**
- Storage buckets `piezas/`, `galeria/`, `cotizaciones/`: lectura pública, escritura admin (cotizaciones: upload vía endpoint firmado, no directo).

## 6. Ejemplos de consulta (para el dashboard)
- Disponibles + valor stock: `select count(*), sum(precio_uyu) from pieces where estado='disponible'`.
- Kanban taller: `select * from pieces where estado in ('por_restaurar','en_restauracion') order by updated_at`.
- Servicios sin precio cargado: `select * from services where activo and (precio_min is null or precio_max is null)`.
- Cotizaciones sin responder >24h: `select * from quotes where estado='nueva' and created_at < now() - interval '24 hours'`.
- Piezas reservadas sin confirmar (query simple, sin `orders`): `select * from pieces where estado='reservada' and updated_at < now() - interval '48 hours'`.
  - (La versión con `orders` para chequear pago queda para Fase 2.)

## 7. Pendientes que define el cliente (no asumir)
- [ ] Categorías fijas (ej: silla, mesa, cómoda, ropero, reloj, cuadro, lámpara…)
- [ ] Qué servicios se crean por defecto en la instalación (semilla)
- [ ] Comuna/barrio: ¿Montevideo + interior? ¿costo flete por depto?
- [ ] Términos/devoluciones: los redactan con él (obligatorio para publicar pagos en Fase 2)

> Nada de esto **bloquea** el MVP: servicios, precios y fotos se cargan después desde `/admin` (`12-decisiones-mvp-sin-mp.md`).
