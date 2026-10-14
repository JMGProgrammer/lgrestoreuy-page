-- 0002_seed.sql — LG Restore Uy
-- Contenido semilla para que la web se vea completa en la primera reunión.
-- TODO lo de acá lo reemplaza el cliente desde /admin (ver Docs/12-decisiones-mvp-sin-mp.md).
--
-- IMPORTANTE sobre precios: se dejan en NULL a propósito. No publicamos
-- números inventados. La web muestra "A consultar" hasta que el cliente
-- cargue los rangos reales en /admin/servicios.

-- =====================================================================
-- site_settings: fila única (id = 1)
-- Solo se crea la fila con lo mínimo. El resto (WhatsApp, dirección, horarios,
-- textos) queda en NULL y lo carga el cliente desde /admin/contenido.
-- El WhatsApp va en formato internacional SIN signos ni espacios: 59890123456
-- =====================================================================
insert into public.site_settings (id, nombre_taller)
values (1, 'L&G Restore')
on conflict (id) do nothing;

-- =====================================================================
-- Servicios: foco en antigüedades + muebles sencillos con lustre y pintura.
-- Tapicería queda inactiva (el cliente dijo "no por ahora").
-- =====================================================================
insert into public.services (nombre, slug, descripcion, icono, orden, activo)
values
  (
    'Reparación de estructura',
    'reparacion-estructura',
    'Reconstrucción de la estructura: junturas, patas, travesaños y herrajes. Se evalúa cada pieza según el daño.',
    'hammer',
    1,
    true
  ),
  (
    'Lustre y barnizado',
    'lustre-y-barnizado',
    'Limpieza profunda, retiro de barniz viejo, lijado y aplicación de lustrado o barniz. Acabado mate, satinado o brillo.',
    'sparkles',
    2,
    true
  ),
  (
    'Pintura y laqueado',
    'pintura-y-laqueado',
    'Pintura en laca, esmalte o poliuretano sobre madera o metal. Incluye preparación de superficie y protección final.',
    'paintbrush',
    3,
    true
  ),
  (
    'Restauración de antigüedades',
    'restauracion-antiguedades',
    'Restauración de piezas de época: muebles, objetos y detalles. Trabajo de paciencia y terminación fina.',
    'clock',
    4,
    true
  ),
  (
    'Tapicería',
    'tapiceria',
    'Cambio de telas, renovación de resortes y estructuras de sillones y sillas. Próximamente.',
    'sofa',
    9,
    false
  )
on conflict (slug) do nothing;