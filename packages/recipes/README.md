<img src="https://raw.githubusercontent.com/WireCore/WireLayer/main/assets/wirelayer.svg" alt="" width="56" height="56" />

# @wirecore/wirelayer-recipes

Framework-agnostic recipes (tailwind-variants) and logic of the WireLayer components – the single place with Tailwind classes, shared by the Vue, React, React Native and HTML packages. Also contains the translations (`/locales/<code>`).

[Storybook](https://wirecore.github.io/WireLayer/) · [GitHub](https://github.com/WireCore/WireLayer) · [Changelog](./CHANGELOG.md)

## Installation

With npm, pnpm, Yarn or Bun:

```sh
npm install @wirecore/wirelayer-recipes
pnpm add @wirecore/wirelayer-recipes
yarn add @wirecore/wirelayer-recipes
bun add @wirecore/wirelayer-recipes
```

## Usage

Usually you do not install it directly – the framework packages depend on it. Use it to build your own components in the WireLayer look or to customize the recipes (`RecipesProvider`).

With `styles-core.css` of the framework packages (smaller CSS file), import the classes of each recipe you call yourself: `@import '@wirecore/wirelayer-recipes/sources/card.css';`

Part of [WireLayer](https://github.com/WireCore/WireLayer) – one look and one API for Vue, React, React Native and HTML, accessible according to WCAG 2.2 AA.

## License

[MIT](./LICENSE) – Copyright (c) 2026 WireCore GmbH
