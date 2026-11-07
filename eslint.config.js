import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

/**
 * Layer boundaries (PLAN.md §5.1, AGENTS.md rule 5):
 *   domain → nothing · data → domain · shared → domain
 *   features → domain | data | shared · app → anything
 * `src/test` holds test helpers; only test files and other helpers may use it.
 */
const LAYERS = [
  { type: 'app', pattern: 'src/app' },
  { type: 'features', pattern: 'src/features' },
  { type: 'domain', pattern: 'src/domain' },
  { type: 'data', pattern: 'src/data' },
  { type: 'shared', pattern: 'src/shared' },
  { type: 'styles', pattern: 'src/styles' },
  { type: 'test', pattern: 'src/test' },
];

/** Storage SDKs may only be imported from `src/data/` (AGENTS.md rule 5). */
const STORAGE_SDK_PATTERNS = [
  { group: ['dexie', 'dexie/*', 'dexie-*'], message: 'Import storage SDKs only from src/data/.' },
  {
    group: ['firebase', 'firebase/*', '@firebase/*'],
    message: 'Import storage SDKs only from src/data/.',
  },
];

export default defineConfig(
  {
    ignores: [
      'dist',
      'coverage',
      'playwright-report',
      'test-results',
      'blob-report',
      'node_modules',
      'pnpm-lock.yaml',
    ],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.{js,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      boundaries,
    },
    settings: {
      'boundaries/elements': LAYERS,
      'boundaries/include': ['src/**/*'],
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: './tsconfig.app.json' },
      },
    },
    rules: {
      ...reactHooks.configs.flat['recommended-latest'].rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'app' } },
              allow: { to: { element: { types: LAYERS.map((l) => l.type) } } },
            },
            {
              from: { element: { type: 'features' } },
              allow: { to: { element: { types: ['domain', 'data', 'shared', 'styles'] } } },
            },
            { from: { element: { type: 'data' } }, allow: { to: { element: { type: 'domain' } } } },
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { type: 'domain' } } },
            },
            {
              from: { element: { type: 'test' } },
              allow: { to: { element: { types: LAYERS.map((l) => l.type) } } },
            },
          ],
        },
      ],
      'no-restricted-imports': ['error', { patterns: STORAGE_SDK_PATTERNS }],
      // Bare `location`/`history`/`event` silently resolve to window globals; use `window.x` explicitly.
      'no-restricted-globals': [
        'error',
        'location',
        'history',
        'event',
        'name',
        'length',
        'status',
        'top',
        'parent',
        'self',
        'close',
        'open',
      ],
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/**/__tests__/**/*.{ts,tsx}'],
    rules: {
      // Tests may use the shared helpers in src/test regardless of the layer they live in.
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            { allow: { to: { element: { type: 'test' } } } },
            {
              from: { element: { type: 'app' } },
              allow: { to: { element: { types: LAYERS.map((l) => l.type) } } },
            },
            {
              from: { element: { type: 'features' } },
              allow: { to: { element: { types: ['domain', 'data', 'shared', 'styles'] } } },
            },
            { from: { element: { type: 'data' } }, allow: { to: { element: { type: 'domain' } } } },
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { type: 'domain' } } },
            },
            {
              from: { element: { type: 'test' } },
              allow: { to: { element: { types: LAYERS.map((l) => l.type) } } },
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/test/**/*.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/data/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['src/**/*.tsx'],
    ...jsxA11y.flatConfigs.recommended,
  },
  {
    files: ['*.{js,mjs,ts}', 'e2e/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  prettier,
);
