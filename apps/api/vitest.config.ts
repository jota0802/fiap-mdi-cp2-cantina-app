import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    passWithNoTests: true,
    coverage: { provider: 'v8', reporter: ['text', 'html'] },
  },
  resolve: { alias: { '@': resolve(__dirname, './src') } },
});
