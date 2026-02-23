import base from './base.js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...base,
  {
    rules: {
      // No React/JSX rules for Shopify theme (vanilla TS/JS)
    },
  },
];
