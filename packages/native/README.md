<img src="https://raw.githubusercontent.com/WireCore/WireLayer/main/assets/wirelayer.svg" alt="" width="56" height="56" />

# @wirecore/wirelayer-native

Around 145 accessible React Native (Expo) components with the prop names of the web packages – selection and calendars as sheets, overlays, navigation, DataTable, charts and more, styled with Uniwind (Tailwind CSS v4).

[Storybook](https://wirecore.github.io/WireLayer/) · [GitHub](https://github.com/WireCore/WireLayer) · [Changelog](./CHANGELOG.md)

## Installation

With npm, pnpm, Yarn or Bun:

```sh
npm install @wirecore/wirelayer-native uniwind tailwindcss lucide-react-native react-native-svg expo-font
pnpm add @wirecore/wirelayer-native uniwind tailwindcss lucide-react-native react-native-svg expo-font
yarn add @wirecore/wirelayer-native uniwind tailwindcss lucide-react-native react-native-svg expo-font
bun add @wirecore/wirelayer-native uniwind tailwindcss lucide-react-native react-native-svg expo-font
```

In an Expo app, `npx expo install @wirecore/wirelayer-native uniwind tailwindcss lucide-react-native react-native-svg expo-font` picks the versions that fit your SDK.

## Usage

```css
@import 'tailwindcss';
@import 'uniwind';
@import '@wirecore/wirelayer-native/styles.css';
```

The Metro configuration (`withUniwindConfig`) and the remaining setup: Storybook › Getting started, section “React Native (Expo)”.

## AI assistants

`llms.txt` (overview) and `llms-full.txt` (every React Native component with its props, the functions and hooks and the guides) ship with the package – point your assistant at `node_modules/@wirecore/wirelayer-native/llms.txt`, e.g. in your CLAUDE.md or AGENTS.md. Or the MCP server [`@wirecore/wirelayer-mcp`](https://www.npmjs.com/package/@wirecore/wirelayer-mcp): `claude mcp add wirelayer -- npx -y -p @wirecore/wirelayer-mcp wirelayer-mcp`.

Part of [WireLayer](https://github.com/WireCore/WireLayer) – one look and one API for Vue, React, React Native and HTML, accessible according to WCAG 2.2 AA.

## License

[MIT](./LICENSE) – Copyright (c) 2026 WireCore GmbH
