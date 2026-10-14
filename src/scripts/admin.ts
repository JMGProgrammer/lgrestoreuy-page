/**
 * Base del panel: Alpine + store de avisos + cliente de API.
 * Se carga una sola vez desde AdminLayout.
 */
import Alpine from 'alpinejs';

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
 * Alpine arranca recién en DOMContentLoaded. Los scripts de Astro son módulos
 * diferidos: se ejecutan todos antes de ese evento, así que cada página
 * registra sus componentes en el orden que quiera.
 */
document.addEventListener(
  'DOMContentLoaded',
  () => {
    Alpine.start();
  },
  { once: true },
);