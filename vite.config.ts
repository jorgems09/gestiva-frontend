import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { join } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-staticwebapp-config',
      closeBundle() {
        // Copiar staticwebapp.config.json al directorio dist después del build
        try {
          copyFileSync(
            join(__dirname, 'staticwebapp.config.json'),
            join(__dirname, 'dist', 'staticwebapp.config.json')
          )
          console.log('✅ staticwebapp.config.json copiado a dist/')
        } catch (error) {
          console.warn('⚠️  No se pudo copiar staticwebapp.config.json:', error)
        }
      },
    },
  ],
})
