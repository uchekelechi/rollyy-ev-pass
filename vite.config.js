import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Rollyy EV Pass demo build config: React + PWA manifest/service worker.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Rollyy EV Pass',
        short_name: 'Rollyy',
        description: 'Voice-first EV charging booking, payment, and pass demo.',
        theme_color: '#0b5fff',
        background_color: '#0b0f19',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: {
    port: 5173
  }
});
