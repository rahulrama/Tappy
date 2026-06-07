import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/Tappy/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icon-source.svg'],
      manifest: {
        name: 'Pomodoro 🍅 Focus Timer',
        short_name: 'Pomodoro',
        description: 'A vibrant, offline-ready Pomodoro focus timer.',
        theme_color: '#c9379d',
        background_color: '#1f1530',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/Tappy/',
        scope: '/Tappy/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/Tappy/index.html',
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
