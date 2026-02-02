import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 8000,
    host: true, // Permite acceso desde la red local (para mobile)
  },
  build: {
    chunkSizeWarningLimit: 2000, // Increase to 2000 kB to suppress warnings
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-utils': ['date-fns']
        }
      }
    }
  }
})
