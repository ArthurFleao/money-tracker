import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: [...configDefaults.exclude, 'e2e/**'],
      restoreMocks: true,
      unstubGlobals: true,
      unstubEnvs: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov', 'json-summary'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/**/__tests__/**',
          'src/test/**',
          'src/app/main.tsx',
          'src/**/*.d.ts',
        ],
        // Thresholds may only go up (AGENTS.md §6).
        thresholds: {
          lines: 80,
          branches: 80,
          functions: 80,
          statements: 80,
          'src/domain/**': { lines: 100, branches: 100, functions: 100, statements: 100 },
          'src/data/**': { lines: 90, branches: 90, functions: 90, statements: 90 },
        },
      },
    },
  }),
);
