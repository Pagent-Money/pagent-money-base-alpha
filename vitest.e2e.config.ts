import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 30000, // 30 seconds for E2E tests
    hookTimeout: 30000,
    // Run tests sequentially to avoid database conflicts
    setupFiles: ['./tests/setup-e2e.ts'],
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules/**', 'src/test/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
