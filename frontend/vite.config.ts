import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/analyze-stream': {
        target:  'ws://localhost:8000',
        ws:       true,
        changeOrigin: true,
      },
      '/analyze': {
        target:  'http://localhost:8000',
        changeOrigin: true,
      },
      '/history': {
        target:  'http://localhost:8000',
        changeOrigin: true,
      },
      '/export': {
        target:  'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
