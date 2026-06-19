import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
      plugins: [react()],
      resolve: {
            alias: {
                  '@': path.resolve(__dirname, './src'),
            },
      },
      test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: ['./src/__tests__/setup.ts'],
            include: ['src/**/*.test.{ts,tsx}'],
            coverage: {
                  provider: 'v8',
                  include: ['src/api/**/*.ts'],
                  exclude: ['src/api/**/index.ts', 'src/api/server/**'],
            },
      },
})
