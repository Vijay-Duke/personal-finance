/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.astro', 'e2e'],
    // Use forks pool - spawns separate processes that inherit NODE_OPTIONS memory limit
    pool: 'forks',
    // Minimal concurrency
    minWorkers: 1,
    maxWorkers: 1,
    // Single file at a time to reduce memory
    fileParallelism: false,
    // Don't isolate - share resources
    isolate: false,
    testTimeout: 30000,
    // Minimal coverage to reduce memory
    coverage: {
      enabled: false,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@pages': path.resolve(__dirname, './src/pages'),
      // Stub heavy modules to empty exports
      'recharts': path.resolve(__dirname, './src/test/stubs/empty.ts'),
      'framer-motion': path.resolve(__dirname, './src/test/stubs/framer-motion.ts'),
      'lottie-react': path.resolve(__dirname, './src/test/stubs/empty.ts'),
      '@ai-sdk/anthropic': path.resolve(__dirname, './src/test/stubs/empty.ts'),
      '@ai-sdk/openai': path.resolve(__dirname, './src/test/stubs/empty.ts'),
      '@ai-sdk/react': path.resolve(__dirname, './src/test/stubs/empty.ts'),
      'ai': path.resolve(__dirname, './src/test/stubs/empty.ts'),
      'better-sqlite3': path.resolve(__dirname, './src/test/stubs/empty.ts'),
    },
  },
});
