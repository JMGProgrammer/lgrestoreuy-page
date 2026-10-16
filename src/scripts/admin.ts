/**
 * Base del panel: Alpine + store de avisos + cliente de API.
 * Se carga una sola vez desde AdminLayout.
 */
import Alpine from 'alpinejs';
import { reducirInput } from './imagen';

export { Alpine };

export type TipoAviso = 'ok' | 'error';

export interface Aviso {
  id: number;
  texto: string;
  tipo: TipoAviso;
  accion?: { texto: string; fn: () => void };
}

let contador = 0;

type AccionAviso = { texto: string; fn: () => void };

interface StoreAvisos {
  lista: Aviso[];
  mostrar: (texto: string, tipo?: TipoAviso, accion?: AccionAviso) => void;
  exito: (texto: string) => void;
  error: (texto: string) => void;
  cerrar: (id: number) => void;
  limpiar: () => void;
}

type Accion = () => void | Promise<void>;

/**
 * Cambios sin guardar, a nivel de toda la aplicación.
 * El layout lo consulta para bloquear la navegación y el recargo de página.
 */
interface StoreCambios {
  tiene: boolean;
  etiqueta: string;
  destino: string | null;
  dialogo: boolean;
  alGuardar: Accion | null;
  alDescartar: Accion | null;
  registrar: (etiqueta: string, guardar: Accion, descartar: Accion) => void;
  set: (tiene: boolean) => void;
  limpiar: () => void;
  cerrarDialogo: () => void;
}

// Función nombrada para que TypeScript tipifique `this` dentro de los métodos.
function crearStoreCambios() {
  return {
    tiene: false,
    etiqueta: '',
    destino: null as string | null,
    dialogo: false,
    alGuardar: null as Accion | null,
    alDescartar: null as Accion | null,

    registrar(this: StoreCambios, etiqueta: string, guardar: Accion, descartar: Accion) {
      this.etiqueta = etiqueta;
      this.alGuardar = guardar;
      this.alDescartar = descartar;
      this.tiene = true;
    },

    set(this: StoreCambios, tiene: boolean) {
      this.tiene = tiene;
    },

    limpiar(this: StoreCambios) {
      this.tiene = false;
      this.etiqueta = '';
      this.alGuardar = null;
      this.alDescartar = null;
      this.destino = null;
      this.dialogo = false;
    },

    cerrarDialogo(this: StoreCambios) {
      this.dialogo = false;
      this.destino = null;
    },
  };
}

Alpine.store('cambios', crearStoreCambios());

Alpine.store('avisos', crearStoreAvisos());

// Función nombrada para que TypeScript tipifique `this` dentro de los métodos.
function crearStoreAvisos() {
  return {
    lista: [] as Aviso[],

    mostrar(
      this: StoreAvisos,
      texto: string,
      tipo: TipoAviso = 'ok',
      accion?: AccionAviso,
    ) {
      const id = ++contador;
      this.lista.push({ id, texto, tipo, accion });

      const quitar = () => this.cerrar(id);
      // Los avisos con acción se quedan un poco más: hay que poder desahacer.
      setTimeout(quitar, accion ? 7000 : 3500);
    },

    exito(this: StoreAvisos, texto: string) {
      this.mostrar(texto, 'ok');
    },

    error(this: StoreAvisos, texto: string) {
      this.mostrar(texto, 'error');
    },

    cerrar(this: StoreAvisos, id: number) {
      this.lista = this.lista.filter((a: Aviso) => a.id !== id);
    },

    limpiar(this: StoreAvisos) {
      this.lista = [];
    },
  };
}

Alpine.store('avisos', crearStoreAvisos());

/** Acceso tipado al store, usable desde los componentes de cada página. */
export const avisos = Alpine.store('avisos') as StoreAvisos;

/** Cliente JSON: siempre devuelve datos o tira con un mensaje entendible. */
export async function api<T>(
  url: string,
  opciones: RequestInit = {},
): Promise<T> {
  const respuesta = await fetch(url, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(opciones.headers ?? {}),
    },
  });

  let cuerpo: unknown = null;
  try {
    cuerpo = await respuesta.json();
  } catch {
    cuerpo = null;
  }

  if (respuesta.status === 401 || respuesta.status === 403) {
    window.location.href = '/admin/login';
    throw new Error('Sesión vencida');
  }

  if (!respuesta.ok) {
    const mensaje =
      (cuerpo as { error?: string } | null)?.error ??
      'No se pudo completar la operación.';
    throw new Error(mensaje);
  }

  return cuerpo as T;
}

/** Aviso de error con el toast del store. */
export function avisarError(e: unknown) {
  const mensaje = e instanceof Error ? e.message : 'Algo salió mal.';
  avisos.error(mensaje);
}

/**
 * Lee los datos que el servidor dejó en un <script type="application/json">.
 * Evita scripts inline: la CSP del panel no los permite.
 * El `<` se escapa para que un texto con "</script>" no rompa el HTML.
 */
export function leerDatos<T>(id: string): T {
  const nodo = document.getElementById(id);
  if (!nodo?.textContent) throw new Error('No se encontraron los datos');
  return JSON.parse(nodo.textContent) as T;
}

declare global {
  interface Window {
    Alpine: typeof Alpine;
  }
}

window.Alpine = Alpine;

/**
 * Guard de navegación: si hay cambios sin guardar, se interrumpe el cambio de
 * sección y se ofrece guardar o descartar. beforeunload cubre el recargo y el
 * cierre de pestaña, que el click no puede interceptar.
 */
function instalarGuardNavegacion() {
  const cambios = Alpine.store('cambios') as StoreCambios;

  document.addEventListener('click', (evento) => {
    if (!cambios.tiene) return;

    const enlace = (evento.target as HTMLElement | null)?.closest('a[href]');
    if (!enlace) return;

    const href = enlace.getAttribute('href') ?? '';
    if (!href.startsWith('/') || href.startsWith('//')) return;

    evento.preventDefault();
    cambios.destino = href;
    cambios.dialogo = true;
  });

  window.addEventListener('beforeunload', (evento) => {
    if (!cambios.tiene) return;
    evento.preventDefault();
    // El navegador muestra su propio aviso. returnValue quedó deprecado pero
    // sigue siendo lo que dispara ese diálogo en la práctica.
    (evento as BeforeUnloadEvent).returnValue = '';
  });
}

/**
 * Compresión de fotos del panel antes de enviar el formulario.
 *
 * Los formularios del admin son POST multipart clásicos al servidor: sin
 * esto, la foto viaja en crudo (3840 px / 3,7 MB) y el servidor la guarda
 * tal cual. Al interceptar el submit y achicar en el dispositivo, el servidor
 * recibe ~300 KB y no hay que cambiar nada del lado de Supabase.
 *
 * Si la compresión falla por lo que sea, el formulario se manda igual con
 * los archivos originales: el servidor valida tipo y tamaño como siempre.
 */
function instalarCompresionImagenes() {
  const MAX_LADO = 1920;
  const CALIDAD = 0.82;

  document.addEventListener('submit', async (evento) => {
    const form = evento.target as HTMLFormElement | null;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.dataset.comprimiendo === '1') return;

    const inputs = Array.from(
      form.querySelectorAll<HTMLInputElement>('input[type="file"]'),
    ).filter((input) => input.files && input.files.length > 0);

    if (inputs.length === 0) return;

    evento.preventDefault();
    form.dataset.comprimiendo = '1';

    const boton = form.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    );
    const textoOriginal = boton?.textContent ?? '';
    if (boton) {
      boton.disabled = true;
      boton.textContent = 'Achicando fotos…';
    }

    try {
      for (const input of inputs) {
        await reducirInput(input, MAX_LADO, CALIDAD);
      }
    } catch {
      // Se manda el formulario igual con los originales.
    } finally {
      if (boton) {
        boton.disabled = false;
        boton.textContent = textoOriginal;
      }
      delete form.dataset.comprimiendo;
      form.submit();
    }
  });
}

/**
 * Alpine arranca recién en DOMContentLoaded. Los scripts de Astro son módulos
 * diferidos: se ejecutan todos antes de ese evento, así que cada página
 * registra sus componentes en el orden que quiera.
 */
document.addEventListener(
  'DOMContentLoaded',
  () => {
    instalarGuardNavegacion();
    instalarCompresionImagenes();
    Alpine.start();
  },
  { once: true },
);