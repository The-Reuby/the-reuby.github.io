import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '', // Empty string for relative paths
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
