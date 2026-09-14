// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://skd-montfort-sur-meu.github.io',
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [icon()],
  server: {
    allowedHosts: ['.trycloudflare.com'],
  },
  redirects: {
    '/admin/': '/admin/index.html',
    '/admin': '/admin/index.html',
    '/competitions': '/evenements',
  }
});
