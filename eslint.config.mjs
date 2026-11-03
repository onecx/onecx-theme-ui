import { defineConfig, globalIgnores } from 'eslint/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default defineConfig([
  globalIgnores([
    '.angular/**/*',
    '.github/**/*',
    '.husky/**/*',
    '.nx/**/*',
    '.scannerwork/**/*',
    '**/data-orchestrator-mock-server.js',
    'dist/**/*',
    'helm/**/*',
    'node_modules/**/*',
    'reports/**/*',
    'src/**/*.ico',
    'src/**/*.svg',
    'src/app/shared/generated/**/*',
    'src/assets/api/*'
  ]),
  {
    files: ['**/*.ts'],

    extends: compat.extends(
      'plugin:@angular-eslint/recommended',
      'plugin:@angular-eslint/template/process-inline-templates',
      'plugin:prettier/recommended',
      'plugin:@typescript-eslint/recommended'
    ),

    languageOptions: {
      globals: {
        __dirname: true
      },

      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: true,
        createDefaultProgram: true
      }
    },

    rules: {
      semi: ['error', 'never'],

      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'none'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase'
        }
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case'
        }
      ]
    }
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  },
  {
    files: ['**/*.html'],
    ignores: ['**/*inline-template-*.component.html'],

    extends: compat.extends('plugin:@angular-eslint/template/recommended', 'plugin:prettier/recommended'),

    rules: {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          parser: 'angular'
        }
      ]
    }
  }
])
