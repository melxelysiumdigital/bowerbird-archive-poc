import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import-x';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import("eslint").Linter.Config[]} */
export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'import-x': importPlugin,
      prettier: prettierPlugin,
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Prettier
      'prettier/prettier': 'warn',

      // Code size limits
      'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],

      // Best practices
      'no-console': 'error',
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'object-shorthand': ['error', 'always'],
      'prefer-template': 'error',
      'no-nested-ternary': 'warn',

      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Imports
      'import-x/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
        },
      ],
      'import-x/no-duplicates': 'warn',
    },
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      '.next/',
      '.turbo/',
      'coverage/',
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
      'next-env.d.ts',
      'theme/assets/',
    ],
  },
  prettierConfig,
];
