/**
 * Alpine no trae tipos resolubles en este proyecto. Declaramos lo justo que
 * usa el panel: el store, Alpine.data y el arranque.
 */
declare module 'alpinejs' {
  interface Magic {
    $store: Record<string, unknown>;
  }

  const Alpine: {
    store: (nombre: string, valor?: unknown) => unknown;
    data: (nombre: string, factory: () => unknown) => void;
    start: () => void;
    magic: (nombre: string, valor: unknown) => void;
  };

  export default Alpine;
}