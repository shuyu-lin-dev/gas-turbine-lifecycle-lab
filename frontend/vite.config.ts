import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue(), {
    name: 'viewer-entry-redirect',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url === undefined) throw new Error('开发请求缺少URL')
        const target = new URL(request.url, 'http://127.0.0.1')
        if (target.pathname !== '/viewer') {
          next()
          return
        }
        response.writeHead(308, { Location: `/viewer/${target.search}` })
        response.end()
      })
    },
  }],
  server: {
    fs: { allow: ['..'] },
    proxy: {
      '/viewer': { target: process.env.VIEWER_PROXY_TARGET ?? 'http://127.0.0.1:4177', changeOrigin: false, ws: true },
      '/api': { target: process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:8201', changeOrigin: true },
    },
  },
})
