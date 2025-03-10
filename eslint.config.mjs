import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    plugins: {
      '@stylistic': stylistic,
    },
  },
  {files: ['**/*.{js,mjs,cjs,ts}']},
  {languageOptions: { globals: {...globals.browser, ...globals.node} }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'quotes': ['error', 'single'],  // Enforce single quotes
      'semi': ['error', 'always'],    // Enforce semicolons,
      '@stylistic/semi': 'off', // disable the stylistic rule for semicolons
      '@stylistic/no-extra-semi': 'error',
      '@stylistic/member-delimiter-style': ['error', {
        multiline: { delimiter: 'semi' }, // Use semicolons in interfaces
        singleline: { delimiter: 'comma' }, // Use commas for single-line members
      }],
      '@stylistic/comma-dangle': ['error', 'always-multiline'], // Ensure trailing commas
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }], // Use 1
    },
  },
  {
    ignores: ['dist/**/*'],
  },
];