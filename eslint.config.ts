import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import vue from 'eslint-plugin-vue';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
    globalIgnores([
        '**/dist',
        '**/storybook-static',
        '**/.turbo',
        '**/.expo',
        '**/uniwind-types.d.ts',
        // Build output of the demo apps
        '**/.nuxt',
        '**/.output',
        '**/.next',
        '**/next-env.d.ts',
    ]),
    js.configs.recommended,
    tseslint.configs.recommended,
    vue.configs['flat/recommended'],
    {
        files: ['**/*.vue'],
        languageOptions: { parserOptions: { parser: tseslint.parser } },
    },
    {
        files: ['packages/vue/src/**/*.vue', 'packages/blocks-vue/src/**/*.vue'],
        rules: {
            // Unprefixed names keep the API identical to @wirecore/wirelayer-react
            'vue/multi-word-component-names': 'off',
            // Variant defaults live in the recipes, not in the props
            'vue/require-default-prop': 'off',
        },
    },
    {
        // Nuxt names pages after their route (index, anfrage)
        files: ['apps/nuxt/app/pages/**/*.vue'],
        rules: { 'vue/multi-word-component-names': 'off' },
    },
    {
        files: [
            'packages/react/**/*.tsx',
            'packages/blocks-react/**/*.tsx',
            'packages/native/**/*.tsx',
            'apps/storybook/**/*.tsx',
            'apps/expo/**/*.tsx',
            'apps/next/**/*.tsx',
        ],
        extends: [reactHooks.configs.flat.recommended],
    },
    {
        languageOptions: { globals: { ...globals.browser, ...globals.node } },
    },
    {
        // Metro loads its config with require()
        files: ['apps/expo/metro.config.js'],
        languageOptions: { sourceType: 'commonjs' },
        rules: { '@typescript-eslint/no-require-imports': 'off' },
    },
    prettier,
]);
