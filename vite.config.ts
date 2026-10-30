import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/weight-tracker/',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'] },
      manifest: {
        name: 'Weight Tracker',
        short_name: 'Weight',
        description: 'Log your weight and see your progress.',
        display: 'standalone',
        start_url: '/weight-tracker/',
        scope: '/weight-tracker/',
        background_color: '#FFE4D6',
        theme_color: '#FFE4D6',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    include: ['tests/*.test.ts'],
  },
});
