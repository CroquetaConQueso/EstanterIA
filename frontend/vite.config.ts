import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/captures': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});