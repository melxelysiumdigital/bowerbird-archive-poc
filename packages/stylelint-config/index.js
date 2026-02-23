/** @type {import("stylelint").Config} */
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'layer',
          'config',
          'source',
          'theme',
          'utility',
          'variant',
          'custom-variant',
          'plugin',
        ],
      },
    ],
    'import-notation': null,
    'no-descending-specificity': null,
    'function-no-unknown': [
      true,
      {
        ignoreFunctions: ['theme'],
      },
    ],
  },
};
