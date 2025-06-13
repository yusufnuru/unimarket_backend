import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Ignore patterns
  {
    ignores: ['dist/**/*', 'eslint.config.mjs'],
  },

  // Base configs
  pluginJs.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettierConfig, // Add Prettier config to disable conflicting rules

  // Language options
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest,
      },
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    files: ['**/*.{js,mjs,cjs,ts}'],
  },

  // Plugins and custom rules
  {
    plugins: {
      '@stylistic': stylistic,
      prettier: prettier, // Add Prettier plugin
    },
    rules: {
      // TypeScript rules (balanced approach)
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      'prettier/prettier': [
        'error',
        {
          printWidth: 100,
          singleLine: true, // This encourages single-line formatting under printWidth
          semi: true,
          singleQuote: true,
          trailingComma: 'all',
          bracketSpacing: true,
        },
      ],

      // Keep some stylistic rules that don't conflict with Prettier
      '@stylistic/no-extra-semi': 'error',
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/no-multiple-empty-lines': [
        'error',
        {
          max: 1,
          maxEOF: 1,
        },
      ],
      '@stylistic/max-len': [
        'error',
        {
          code: 100,
        },
      ],
    },
  },
);
