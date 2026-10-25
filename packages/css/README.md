<img src="https://raw.githubusercontent.com/WireCore/WireLayer/main/assets/wirelayer.svg" alt="" width="56" height="56" />

# @wirecore/wirelayer-css

The WireLayer components as plain CSS classes (`.wc-*`) for HTML and server templates (Blade, Twig, Astro …) – generated from the same recipes as the Vue and React components, for everything that works without JavaScript.

[Storybook](https://wirecore.github.io/WireLayer/) · [GitHub](https://github.com/WireCore/WireLayer) · [Changelog](./CHANGELOG.md)

## Installation

```sh
pnpm add @wirecore/wirelayer-css
```

## Usage

Self-contained, without a build step – ship `dist/wirecore.css` and `dist/fonts/` side by side:

```html
<link rel="stylesheet" href="/assets/wirecore/wirecore.css" /> <button class="wc-button">Save</button>
```

With your own Tailwind build:

```css
@import 'tailwindcss';
@import '@wirecore/wirelayer-tokens/theme.css';
@import '@wirecore/wirelayer-tokens/fonts.css';
@import '@wirecore/wirelayer-css/components.css';
```

The bundled fonts are licensed under the SIL Open Font License 1.1 (`dist/fonts/OFL.txt`), see [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## AI assistants

`llms.txt` (overview) and `llms-full.txt` (the class reference: every component with its parts and modifiers and the guides) ship with the package – point your assistant at `node_modules/@wirecore/wirelayer-css/llms.txt`, e.g. in your CLAUDE.md or AGENTS.md. Or the MCP server [`@wirecore/wirelayer-mcp`](https://www.npmjs.com/package/@wirecore/wirelayer-mcp): `claude mcp add wirelayer -- npx -y -p @wirecore/wirelayer-mcp wirelayer-mcp`.

Part of [WireLayer](https://github.com/WireCore/WireLayer) – one look and one API for Vue, React, React Native and HTML, accessible according to WCAG 2.2 AA.

## License

[MIT](./LICENSE) – Copyright (c) 2026 WireCore GmbH
