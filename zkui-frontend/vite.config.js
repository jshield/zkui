import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/appsettings.json': {
        target: 'https://zookeeper.zoodata.com.au',
        changeOrigin: true,
        rewrite: () => '/appsettings.json'
      },
      '/oauth/devicecode': {
        target: 'https://login.microsoftonline.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/oauth\/devicecode\/([^/]+)/, '/$1/oauth2/v2.0/devicecode'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('Origin');
          });
        }
      },
      '/oauth/token': {
        target: 'https://login.microsoftonline.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/oauth\/token\/([^/]+)/, '/$1/oauth2/v2.0/token'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('Origin');
          });
        }
      }
    }
  }
})
