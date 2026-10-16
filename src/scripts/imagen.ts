/**
 * Reducción de imágenes en el navegador, antes de subir a Storage.
 *
 * Por qué acá y no en el servidor: el servidor recibe el archivo ya subido,
 * así que comprimir ahí no ahorra ni un byte de transferencia — y en el
 * celular con datos esa transferencia es lo que más duele. Al achicar en el
 * dispositivo, una foto de 3840 px / 3,7 MB llega como 1920 px / ~300 KB.
 *
 * Se usa en dos lugares:
 * - /cotizar (subida directa a `cotizaciones` desde el browser)
 * - /admin (formularios multipart que POSTean al servidor)
 *
 * Sin dependencias: canvas + createImageBitmap, disponible en todos los
 * navegadores modernos incluido el celular.
 */

/** Lo que devuelve la reducción, listo para subir. */
export interface ImagenReducida {
  archivo: File;
  /** true si se comprimió, false si se devolvió el original. */
  reducida: boolean;
}

/** GIF animado: no se toca, canvas mataría la animación. */
function esGif(archivo: File): boolean {
  return archivo.type === 'image/gif';
}

/**
 * Nuevo tamaño manteniendo proporción. Si ya entra, devuelve el original.
 * Función pura y testeable sin navegador.
 */
export function calcularTamanio(
  ancho: number,
  alto: number,
  maxLado: number,
): { ancho: number; alto: number; necesita: boolean } {
  const lado = Math.max(ancho, alto);
  if (!Number.isFinite(ancho) || !Number.isFinite(alto) || lado <= 0) {
    return { ancho, alto, necesita: false };
  }
  if (lado <= maxLado) return { ancho, alto, necesita: false };

  const escala = maxLado / lado;
  return {
    ancho: Math.round(ancho * escala),
    alto: Math.round(alto * escala),
    necesita: true,
  };
}

/** Tipo de salida: WebP sigue WebP, el resto va a JPEG (fotos opacas). */
function tipoSalida(tipoOriginal: string): { tipo: string; extension: string } {
  if (tipoOriginal === 'image/webp') return { tipo: 'image/webp', extension: 'webp' };
  return { tipo: 'image/jpeg', extension: 'jpg' };
}

function cambiarExtension(nombre: string, extension: string): string {
  const base = nombre.replace(/\.[a-z0-9]+$/i, '') || 'foto';
  return `${base}.${extension}`;
}

/**
 * Reduce una imagen al lado máximo indicado. Si ya es chica o no es
 * imagen procesable, devuelve el archivo original sin tocarlo.
 */
export async function reducirImagen(
  archivo: File,
  maxLado: number,
  calidad = 0.82,
): Promise<ImagenReducida> {
  if (!(archivo instanceof Blob) || !archivo.type.startsWith('image/')) {
    return { archivo, reducida: false };
  }
  if (esGif(archivo)) return { archivo, reducida: false };

  let bitmap: ImageBitmap | null = null;
  let urlTemporal = '';

  try {
    bitmap = await createImageBitmap(archivo);
  } catch {
    // createImageBitmap falla con archivos corruptos: se sube el original
    // y el servidor valida tipo/tamaño como siempre.
    return { archivo, reducida: false };
  }

  try {
    const { ancho, alto, necesita } = calcularTamanio(
      bitmap.width,
      bitmap.height,
      maxLado,
    );

    // Chica y liviana: no vale la pena recomprimir y perder calidad.
    if (!necesita && archivo.size < 500 * 1024) {
      return { archivo, reducida: false };
    }

    // Chica pero pesada (PNG de captura, por ejemplo): se recomprime
    // al mismo tamaño para bajar peso sin cambiar dimensiones.
    const destinoAncho = necesita ? ancho : bitmap.width;
    const destinoAlto = necesita ? alto : bitmap.height;

    const canvas = document.createElement('canvas');
    canvas.width = destinoAncho;
    canvas.height = destinoAlto;

    const ctx = canvas.getContext('2d');
    if (!ctx) return { archivo, reducida: false };

    // JPEG no tiene alfa: fondo blanco para no terminar con negro
    // si la fuente era un PNG con transparencia.
    const { tipo, extension } = tipoSalida(archivo.type);
    if (tipo === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, destinoAncho, destinoAlto);
    }

    ctx.drawImage(bitmap, 0, 0, destinoAncho, destinoAlto);

    const blob = await new Promise<Blob | null>((resolver) =>
      canvas.toBlob(resolver, tipo, calidad),
    );

    if (!blob || blob.size >= archivo.size) {
      // La "compresión" quedó más pesada que el original: no sirve.
      return { archivo, reducida: false };
    }

    const nombre = cambiarExtension(archivo.name || 'foto.jpg', extension);
    return {
      archivo: new File([blob], nombre, { type: tipo, lastModified: Date.now() }),
      reducida: true,
    };
  } catch {
    return { archivo, reducida: false };
  } finally {
    bitmap?.close();
    if (urlTemporal) URL.revokeObjectURL(urlTemporal);
  }
}

/**
 * Reduce todos los archivos de un <input type="file"> y los reemplaza en el
 * propio input (vía DataTransfer). Devuelve cuántas se redujeron.
 */
export async function reducirInput(
  input: HTMLInputElement,
  maxLado: number,
  calidad = 0.82,
): Promise<number> {
  const archivos = Array.from(input.files ?? []);
  if (archivos.length === 0) return 0;

  const dt = new DataTransfer();
  let reducidas = 0;

  for (const archivo of archivos) {
    const { archivo: final, reducida } = await reducirImagen(
      archivo,
      maxLado,
      calidad,
    );
    if (reducida) reducidas += 1;
    dt.items.add(final);
  }

  input.files = dt.files;
  return reducidas;
}
