<img src="https://raw.githubusercontent.com/WireCore/WireLayer/main/assets/wirelayer.svg" alt="" width="56" height="56" />

# @wirecore/wirelayer-vue

Around 180 accessible Vue 3 components on Ark UI and Tailwind CSS v4 – forms, DataTable, charts, editor, scheduler, overlays, navigation and more, with the same API as `@wirecore/wirelayer-react`.

[Storybook](https://wirecore.github.io/WireLayer/) · [GitHub](https://github.com/WireCore/WireLayer) · [Changelog](./CHANGELOG.md)

## Installation

```sh
pnpm add @wirecore/wirelayer-vue
```

## Usage

```css
@import 'tailwindcss';
@import '@wirecore/wirelayer-vue/styles.css';
```

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

Part of [WireLayer](https://github.com/WireCore/WireLayer) – one look and one API for Vue, React, React Native and HTML, accessible according to WCAG 2.2 AA.

## License

[MIT](./LICENSE) – Copyright (c) 2026 WireCore GmbH
