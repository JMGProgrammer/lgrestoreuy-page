/**
 * Validación de la cotización, del lado del servidor.
 * El cliente valida para dar feedback rápido, pero esto es lo que cuenta:
 * anybody puede llamar a /api/cotizaciones.
 */
import type { Quote } from './types';

export interface QuoteInput {
  nombre: string;
  telefono: string;
  comuna?: string | null;
  tipoMueble?: string | null;
  servicio?: string | null;
  medidas?: string | null;
  descripcion?: string | null;
  fotos?: string[];
}

export interface QuoteValidation {
  ok: boolean;
  errores: Record<string, string>;
  datos?: Quote;
}

const TELEFONO_UY = /^[0-9\s+()-]{8,20}$/;
const MAX_FOTOS = 5;

/**
 * Una foto puede llegar como ruta de Storage (bucket privado `cotizaciones`)
 * o como URL pública (bucket `piezas`).
 */
const RUTA_SEGURA = /^[A-Za-z0-9/_.-]{1,255}$/;

function texto(valor: unknown, max: number): string | null {
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim().slice(0, max);
  return limpio.length > 0 ? limpio : null;
}

export function validarQuote(cuerpo: unknown): QuoteValidation {
  const errores: Record<string, string> = {};
  const input = (cuerpo ?? {}) as Record<string, unknown>;

  const nombre = texto(input.nombre, 120);
  if (!nombre) errores.nombre = 'Escribí tu nombre.';
  else if (nombre.length < 2) errores.nombre = 'El nombre es muy corto.';

  const telefono = texto(input.telefono, 30);
  if (!telefono) errores.telefono = 'Necesitamos un teléfono para contactarte.';
  else if (!TELEFONO_UY.test(telefono))
    errores.telefono = 'Revisá el teléfono: solo números, espacios y + ( ).';

  // Las fotos llegan como ruta de Storage o como URL, ya subida.
  const fotosRaw = Array.isArray(input.fotos) ? input.fotos : [];
  const fotos = fotosRaw
    .filter((valor): valor is string => typeof valor === 'string')
    .filter(
      (valor) =>
        (valor.startsWith('https://') || valor.startsWith('http://')) ||
        RUTA_SEGURA.test(valor),
    )
    .slice(0, MAX_FOTOS);

  if (!nombre || !telefono) {
    return { ok: false, errores };
  }

  const datos: Quote = {
    id: '',
    nombre,
    telefono,
    comuna: texto(input.comuna, 120),
    tipo_mueble: texto(input.tipoMueble, 80),
    servicio: texto(input.servicio, 80),
    medidas: texto(input.medidas, 200),
    descripcion: texto(input.descripcion, 2000),
    fotos,
    estado: 'nueva',
    monto_cotizado: null,
    monto_abono: null,
    created_at: '',
  };

  return { ok: true, errores, datos };
}