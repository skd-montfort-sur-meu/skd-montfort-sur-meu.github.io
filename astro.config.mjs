// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://skd-montfort-sur-meu.fr',
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [icon(), sitemap()],
  server: {
    allowedHosts: ['.trycloudflare.com'],
  },
  redirects: {
    '/admin/': '/admin/index.html',
    '/admin': '/admin/index.html',
    '/competitions': '/evenements',
  }
});
