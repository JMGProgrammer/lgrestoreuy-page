// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // On-demand: el contenido lo edita el cliente desde /admin, así que las
  // páginas se generan por request en vez de quedar horneadas en el build.
  output: 'server',

  vite: {
    plugins: [tailwindcss()],

    build: {
      // Los <script> chicos se inlinan por defecto en el HTML. Acá no sirve:
      // la CSP pública es `script-src 'self'` (sin unsafe-inline), así que
      // un script inline se bloquea y el comparador, la cortina, el carrusel
      // y el visor morirían en producción (en dev andan porque ahí sí se
      // permite unsafe-inline). Con 0 todo script va a archivo externo.
      assetsInlineLimit: 0,
    },
  },

  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
});