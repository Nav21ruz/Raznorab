import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Путь, по которому приложение раздаётся:
//   '/'            — свой домен (по умолчанию)
//   '/raznorab/'   — GitHub Pages (подпапка репозитория)
// Задаётся через VITE_BASE_PATH, роутер берёт то же значение из import.meta.env.BASE_URL.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/'

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Briggo — заказы и подработки',
          short_name: 'Briggo',
          description: 'Биржа для стройки: заказчики, строители и разнорабочие находят друг друга',
          lang: 'ru',
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#0d131f',
          theme_color: '#0d131f',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          // config.js правится прямо на хостинге — если закэшировать его в service worker,
          // приложение продолжит работать со старыми ключами
          globIgnores: ['**/config.js'],
          // API и авторизация всегда идут в сеть — кэшировать чужие/приватные данные нельзя
          navigateFallbackDenylist: [/^\/api/],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/rest/v1') || url.pathname.startsWith('/auth/v1'),
              handler: 'NetworkOnly',
            },
          ],
        },
        devOptions: {
          // в dev service worker мешает отладке и кэширует старый код
          enabled: false,
        },
      }),
    ],
    base,
  }
})
