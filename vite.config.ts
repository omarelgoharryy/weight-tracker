import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

export default defineConfig({
  base: '/weight-tracker/',
  plugins: [preact()],
  test: {
    globals: true,
    include: ['tests/*.test.ts'],
  },
});
