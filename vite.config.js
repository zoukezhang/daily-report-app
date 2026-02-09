import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  define: {
    '__BUILD_TIME__': JSON.stringify(new Date().toLocaleString()),
    '__APP_VERSION__': JSON.stringify(packageJson.version)
  },
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3007',
        changeOrigin: true,
      },
    },
  },
})
