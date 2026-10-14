/**
 * Helpers de WhatsApp.
 *
 * En el MVP no hay pagos: cada pieza y cada cotización se conversan por
 * WhatsApp. Estos helpers arman los deep links con el texto ya escrito,
 * así el cliente recibe el mensaje listo para enviar.
 *
 * Docs: Docs/12-decisiones-mvp-sin-mp.md
 */

/** Normaliza un teléfono a formato internacional sin signos: 59890123456 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 8) return null;
  return digits;
}

/**
 * Arma el link wa.me con mensaje precargado.
 * https://wa.me/<numero>?text=<mensaje codificado>
 */
export function whatsappLink(
  phone: string | null | undefined,
  message?: string,
): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const base = `https://wa.me/${normalized}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Mensaje para consultar por una pieza de la vitrina */
export function pieceInquiryMessage(piece: {
  titulo: string;
  precio?: number | null;
  slug?: string | null;
  url?: string | null;
}): string {
  const lines = [`Hola, vi la pieza "${piece.titulo}" en la web y me interesa.`];

  if (piece.precio) lines.push(`Precio publicado: $${piece.precio} UYU`);
  if (piece.url) lines.push(`Link: ${piece.url}`);

  lines.push('¿Sigue disponible? ¿Hacen entrega a domicilio?');
  return lines.join('\n');
}

/** Mensaje para una cotización: el cliente escribe, no la web */
export function generalInquiryMessage(siteName: string): string {
  return `Hola, te escribo desde la web de ${siteName}. Quisiera hacer una consulta por una restauración.`;
}

/** Formato de precio para mostrar: $12.000 UYU */
export function formatUYU(amount: number | null | undefined): string | null {
  if (amount === null || amount === undefined) return null;
  return `$${new Intl.NumberFormat('es-UY').format(amount)}`;
}

/**
 * Rango de precio de un servicio.
 * Sin rango cargado → "A consultar" (no inventamos números).
 */
export function formatPriceRange(
  min: number | null | undefined,
  max: number | null | undefined,
): string {
  const minText = formatUYU(min);
  const maxText = formatUYU(max);

  if (minText && maxText) return `${minText} – ${maxText} UYU`;
  if (minText) return `Desde ${minText} UYU`;
  if (maxText) return `Hasta ${maxText} UYU`;
  return 'A consultar';
}