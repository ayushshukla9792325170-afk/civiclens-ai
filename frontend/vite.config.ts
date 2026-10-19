import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://civiclens-ai-x6or.onrender.com',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'https://civiclens-ai-x6or.onrender.com',
        changeOrigin: true,
      },
      '/ws': {
        target: 'https://civiclens-ai-x6or.onrender.com',
        ws: true,
      }
    }
  }
})
