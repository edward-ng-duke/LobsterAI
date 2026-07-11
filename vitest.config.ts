import path from 'node:path';

import { configDefaults, defineConfig } from 'vitest/config';

const evidenceBootstrap = path.resolve(__dirname, 'scripts/db/evidence-bootstrap.mjs');
const nodeOptions = [process.env.NODE_OPTIONS, `--import=${evidenceBootstrap}`]
  .filter(Boolean)
  .join(' ');

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
      '@': path.resolve(__dirname, './src/renderer'),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: [...configDefaults.exclude, 'tests/integration/**'],
    environment: 'node',
    env: { NODE_OPTIONS: nodeOptions },
  },
});
