import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'LEGO WeDo 2.0',
        short_name: 'WeDo 2.0',
        description: 'Programa y controla tu robot LEGO WeDo 2.0',
        theme_color: '#f59e0b',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,woff,woff2}'],
      },
    }),
  ],
})
