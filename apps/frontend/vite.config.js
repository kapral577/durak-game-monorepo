import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Настройка алиасов
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../../packages/shared/src')
    }
  },
  
  // Исправление для react-helmet-async
  ssr: {
    noExternal: ['react-helmet-async']
  },
  
  // Настройки для Sass и Bootstrap
  css: {
    preprocessorOptions: {
      scss: {
        // Отключение предупреждений о deprecated @import
        silenceDeprecations: ['import'],
        // Дополнительные опции для Bootstrap
        additionalData: `
          $enable-css-grid: true;
          $enable-responsive-font-sizes: true;
        `
      }
    }
  },
  
  // Настройки сборки
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          bootstrap: ['bootstrap']
        }
      }
    }
  },
  
  // Настройки для разработки
  server: {
    port: 3000,
    open: true
  }
})
