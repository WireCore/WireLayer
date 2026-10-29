<img src="https://raw.githubusercontent.com/WireCore/WireLayer/main/assets/wirelayer.svg" alt="" width="56" height="56" />

# @wirecore/wirelayer-vue

Around 180 accessible Vue 3 components on Ark UI and Tailwind CSS v4 – forms, DataTable, charts, editor, scheduler, overlays, navigation and more, with the same API as `@wirecore/wirelayer-react`.

[Storybook](https://wirecore.github.io/WireLayer/) · [GitHub](https://github.com/WireCore/WireLayer) · [Changelog](./CHANGELOG.md)

## Installation

With npm, pnpm, Yarn or Bun:

```sh
npm install @wirecore/wirelayer-vue
pnpm add @wirecore/wirelayer-vue
yarn add @wirecore/wirelayer-vue
bun add @wirecore/wirelayer-vue
```

## Usage

```css
@import 'tailwindcss';
@import '@wirecore/wirelayer-vue/styles.css';
```

For a smaller CSS file, import `@wirecore/wirelayer-vue/styles-core.css` instead and only the classes of the components you use (`@wirecore/wirelayer-vue/sources/Button.css` …) – see Storybook › Getting started › Welcome.

```vue
<script setup lang="ts">
import { Button, Field, Input } from '@wirecore/wirelayer-vue';
</script>

<template>
    <Field label="Email" required>
        <Input v-model="email" type="email" />
    </Field>
    <Button>Start project</Button>
</template>
```

Optional subpaths with their own peer dependencies: `/form` (TanStack Form), `/data-table`, `/virtual`, `/chart` (Chart.js), `/editor` (Tiptap), `/code` (Shiki), `/pdf` (pdf.js), `/locales/<code>`. Setup for Nuxt: Storybook › Getting started.

## AI assistants

`llms.txt` (overview) and `llms-full.txt` (every component with its props, events and slots, the functions and the guides) ship with the package – point your assistant at `node_modules/@wirecore/wirelayer-vue/llms.txt`, e.g. in your CLAUDE.md or AGENTS.md. Or the MCP server [`@wirecore/wirelayer-mcp`](https://www.npmjs.com/package/@wirecore/wirelayer-mcp): `claude mcp add wirelayer -- npx -y -p @wirecore/wirelayer-mcp wirelayer-mcp`.

Part of [WireLayer](https://github.com/WireCore/WireLayer) – one look and one API for Vue, React, React Native and HTML, accessible according to WCAG 2.2 AA.

## License

[MIT](./LICENSE) – Copyright (c) 2026 WireCore GmbH
