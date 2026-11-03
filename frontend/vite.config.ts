import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    fs: { allow: ['..'] },
    proxy: {
      '/viewer': { target: process.env.VIEWER_PROXY_TARGET ?? 'http://127.0.0.1:4177', changeOrigin: false, ws: true },
      '/api': { target: process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:8201', changeOrigin: true },
    },
  },
})
