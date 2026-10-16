import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      // /api/v1/health -> http://localhost:3333/v1/health
      '/api': {
        target: 'http://localhost:3333',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
