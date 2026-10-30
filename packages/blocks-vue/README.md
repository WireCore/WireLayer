<img src="https://raw.githubusercontent.com/WireCore/WireLayer/main/assets/wirelayer.svg" alt="" width="56" height="56" />

# @wirecore/wirelayer-blocks-vue

Page blocks for Vue built on `@wirecore/wirelayer-vue`: SiteHeader, CtaSection, ModeToggle, AuthForm, AuthLayout and the ConditionBuilder (nested AND/OR rules, also the editor of the DataTable's advanced filter).

[Storybook](https://wirecore.github.io/WireLayer/) · [GitHub](https://github.com/WireCore/WireLayer) · [Changelog](./CHANGELOG.md)

## Installation

With npm, pnpm, Yarn or Bun:

```sh
npm install @wirecore/wirelayer-blocks-vue @wirecore/wirelayer-vue
pnpm add @wirecore/wirelayer-blocks-vue @wirecore/wirelayer-vue
yarn add @wirecore/wirelayer-blocks-vue @wirecore/wirelayer-vue
bun add @wirecore/wirelayer-blocks-vue @wirecore/wirelayer-vue
```

## Usage

```vue
<script setup lang="ts">
import { ConditionBuilder } from '@wirecore/wirelayer-blocks-vue';
</script>
```

The classes come with `@wirecore/wirelayer-vue/styles.css`. With `styles-core.css` (smaller CSS file), import those of each block you use: `@import '@wirecore/wirelayer-blocks-vue/sources/SiteHeader.css';`

Part of [WireLayer](https://github.com/WireCore/WireLayer) – one look and one API for Vue, React, React Native and HTML, accessible according to WCAG 2.2 AA.

## License

[MIT](./LICENSE) – Copyright (c) 2026 WireCore GmbH
