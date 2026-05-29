// @ts-check
const tseslint = require('typescript-eslint');
const prettierConfig = require('eslint-config-prettier');

module.exports = tseslint.config(
  // TypeScript-aware rules for files included in the main tsconfig
  {
    files: ['api/**/*.ts', 'web/**/*.ts', 'fixtures/**/*.ts'],
    extends: [...tseslint.configs.recommended, prettierConfig],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'error',
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },

  // Unit tests use the Jest tsconfig (includes test files excluded from main)
  {
    files: ['unit/**/*.ts'],
    extends: [...tseslint.configs.recommended, prettierConfig],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.jest.json',
        tsconfigRootDir: __dirname,
      },
    },
  },

  // Config files — TypeScript parsing without type-aware rules
  {
    files: ['*.config.js', '*.config.ts', 'jest.config.js'],
    extends: [...tseslint.configs.recommended, prettierConfig],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'mutation-report/**',
      'test-results/**',
      'web/playwright/visual-baselines/**',
      'performance/**',
      'mobile/**',
    ],
  }
);
