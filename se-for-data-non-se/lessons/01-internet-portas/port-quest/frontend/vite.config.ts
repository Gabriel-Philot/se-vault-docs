import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        // In Docker, Vite runs inside the container so uses the Docker DNS name.
        // For local dev outside Docker, change to http://localhost:80
        target: process.env.DOCKER ? 'http://gateway:80' : 'http://localhost:80',
        changeOrigin: true,
      },
    },
  },
});
