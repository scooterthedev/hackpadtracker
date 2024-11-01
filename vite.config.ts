import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: true,
    proxy: {
      '/api/slack': {
        target: 'https://slack.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/slack/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        },
      },
      '/api/progress': {
        target: 'https://hackpadtracker.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/progress/, '/api/progress')
      }
    },
  },
});