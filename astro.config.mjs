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
  },

  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
});