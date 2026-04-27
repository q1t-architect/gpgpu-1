import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path for GitHub Pages: https://q1t-architect.github.io/gpgpu-1/
export default defineConfig({
  base: '/gpgpu-1/',
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 800,
  },
  server: {
    host: true,
    port: 5173,
  },
});
