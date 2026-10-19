import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Absolute paths so assets resolve on every route (served from the domain root on Vercel)
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
