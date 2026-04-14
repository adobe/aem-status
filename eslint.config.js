import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['helix-importer-ui/**', 'node_modules/**', '.yolo/**'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'linebreak-style': ['error', 'unix'],
      'no-param-reassign': ['error', { props: false }],
    },
  },
  {
    files: ['scripts/reclassify-incidents.js', 'scripts/update-incidents-index.js', 'scripts/when.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
