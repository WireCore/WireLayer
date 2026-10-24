<img src="assets/wirelayer.svg" alt="" width="72" height="72" />

# WireLayer Component Library

Component library for **Vue**, **React**, **React Native** and **HTML**, built on **Tailwind CSS v4**, **Ark UI**,
**Uniwind** and **Lucide** – one look, one API, accessible according to WCAG 2.2 AA. The packages are called
`@wirecore/wirelayer-*`.

## Installation

Tailwind CSS v4 is required.

```sh
pnpm add @wirecore/wirelayer-vue      # or
pnpm add @wirecore/wirelayer-react    # or
pnpm add @wirecore/wirelayer-native   # React Native / Expo
```

```css
@import 'tailwindcss';
@import '@wirecore/wirelayer-vue/styles.css'; /* or @wirecore/wirelayer-react/styles.css */
```

For a smaller CSS file, import `styles-core.css` instead and only the classes of the components you use
(`@wirecore/wirelayer-vue/sources/Button.css` …) – Storybook › Getting started › Welcome.

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

Setup for Nuxt, Next.js, Expo and plain HTML, themes and customization: Storybook › Getting started.

## Components

**Vue and React** – around 180 components with an identical prop API and identical DOM, among them:

- **Forms:** Field, Input, Select/MultiSelect/Combobox/Autocomplete (arbitrary values, groups, search, loading more),
  Listbox, TagsInput, Date/Time/Month/Quarter/YearPicker, DateRangePicker, TimeRangePicker, NumberInput, MaskInput,
  PhoneInput, ColorPicker, FileUpload, Mentions, Wizard, FilterPanel, Editor (Tiptap)
- **Data:** DataTable (filters, grouping, pivot, tree rows, cell ranges, editing with undo, export, virtual, server
  data), DataView, Tree/VirtualTree, Kanban, Scheduler and Gantt, Timeline, OrgChart, charts (Chart.js) and custom
  visualizations (Heatmap, Treemap, Sankey, Funnel …), chat building blocks, Markdown, CodeHighlight, JsonViewer,
  LogViewer, QrCode
- **Navigation and layout:** AppShell, SidebarNav, MegaMenu, NavigationMenu, Menubar, Tabs, Stepper, CommandPalette,
  BottomNavigation, PageHeader, Splitter, layout building blocks (Stack, Group, SimpleGrid …)
- **Overlays and feedback:** Dialog (also as a service), Drawer, Menu, Popover, Tooltip, Toast, Tour, ConfirmDialog,
  Banner, NotificationCenter, Progress, SessionTimeout
- **Utilities:** LocaleProvider, RecipesProvider, ConfigProvider, LiveAnnouncer, SkipLinks, HotkeysDialog and around 40
  hooks or composables with the same names (`useDisclosure`, `useLocalStorage`, `useHotkeys` …)

**React Native** (`@wirecore/wirelayer-native`) – around 145 components with the prop names of the web: selection,
calendars and menus as sheets, overlays, navigation without a router, data (DataTable, Tree, Kanban, Scheduler, Gantt as
a list, Chat), charts on react-native-svg, hooks.

**HTML** (`@wirecore/wirelayer-css`) – `.wc-*` classes for everything that works without JavaScript, generated from the
recipes.

**Page blocks** (`@wirecore/wirelayer-blocks-vue`, `@wirecore/wirelayer-blocks-react`) – SiteHeader, CtaSection,
ModeToggle, AuthForm, AuthLayout and ConditionBuilder (nested AND/OR rules, also as the editor of the advanced
DataTable filter: `renderAdvancedFilter` or the slot `#advancedFilter`).

All components and props: Storybook and `llms.txt`, or the MCP server `@wirecore/wirelayer-mcp` for AI assistants
(`claude mcp add wirelayer -- npx -y -p @wirecore/wirelayer-mcp wirelayer-mcp`).

### Subpaths with optional peer dependencies

What a large library needs lives in its own subpaths – it only ends up in the bundle when the app imports it, and then
needs the respective peer dependency:

| Subpath           | Vue / React                                                        | React Native (`@wirecore/wirelayer-native/…`)        |
| ----------------- | ------------------------------------------------------------------ | ---------------------------------------------------- |
| `/form`           | TanStack Form, validators, FormList                                | TanStack Form                                        |
| `/data-table`     | DataTable (TanStack Table)                                         | DataTable without TanStack (table or cards)          |
| `/virtual`        | VirtualSelect, VirtualList, VirtualTree, `virtualRows` (DataTable) | –                                                    |
| `/chart`          | Charts on Chart.js                                                 | Charts on react-native-svg                           |
| `/editor`         | Rich text editor on Tiptap                                         | –                                                    |
| `/code`           | CodeHighlight on Shiki (`shiki/core`)                              | CodeHighlight on Shiki (JavaScript RegExp engine)    |
| `/pdf`            | PdfViewer on pdf.js (`pdfjs-dist`)                                 | PdfViewer on react-native-pdf (development build)    |
| `/locales/<code>` | Language modules (see below)                                       | Language modules                                     |
| `/expo-*`         | –                                                                  | `expo-sharing`, `expo-clipboard`, file/image pickers |

## Languages

English (default) is built in. More languages are available as separate modules and only end up in the bundle when an
app imports them: `de`, `fr`, `es`, `it`, `pt` (Portugal), `pt-BR`, `nl`, `pl`, `cs`, `hu`, `lv`, `ar` and
`tr` – each under `@wirecore/wirelayer-vue/locales/<code>`, `@wirecore/wirelayer-react/locales/<code>`,
`@wirecore/wirelayer-native/locales/<code>` (or `@wirecore/wirelayer-recipes/locales/<code>`).

```ts
import { registerLocale } from '@wirecore/wirelayer-vue'; // or @wirecore/wirelayer-react, @wirecore/wirelayer-native
import { de } from '@wirecore/wirelayer-vue/locales/de';
import { fr } from '@wirecore/wirelayer-vue/locales/fr';
import { ptBR } from '@wirecore/wirelayer-vue/locales/pt-BR';

// Once at startup, before the first render
registerLocale('de', de); // applies to de-DE, de-AT, de-CH …
registerLocale('fr', fr); // applies to fr-FR, fr-CA, fr-CH …
registerLocale('pt-BR', ptBR); // a region takes precedence over its language
```

After that, `<LocaleProvider locale="de-DE">` or `<LocaleProvider locale="fr-CA">` is enough.
Alternatively, `LocaleProvider` receives the texts directly (`translations={fr}`). Unregistered languages fall back to
English; the writing direction (`ar`, `he`, `fa`, `ur` → right to left) follows from the locale. Custom languages are a
complete `Translations` object – the TypeScript type reports missing texts. The bundled translations should be reviewed
by native speakers before use.

## PDF viewer

`PdfViewer` from `@wirecore/wirelayer-vue/pdf` or `@wirecore/wirelayer-react/pdf` is built on `pdfjs-dist` (optional
peer dependency, license **Apache-2.0**, compatible with MIT projects). The app includes
`pdfjs-dist/legacy/web/pdf_viewer.css` once and passes the URL of the worker (`workerSrc`) – recipes for Vite, Nuxt and
Next.js in Storybook › Getting started. The sample PDFs of the stories (`apps/storybook/public/pdf`) are generated by
`node apps/storybook/scripts/sample-pdf.ts`.

## Development

Docker is the only requirement – Node and pnpm run in the container.

```sh
docker compose up
```

| URL                   | Content                                                 |
| --------------------- | ------------------------------------------------------- |
| http://localhost:6006 | Storybook: getting started, foundations, all frameworks |
| http://localhost:6007 | Storybook Vue                                           |
| http://localhost:6008 | Storybook React                                         |
| http://localhost:6009 | Storybook React Native (react-native-web)               |
| http://localhost:6010 | Storybook HTML / CSS (`@wirecore/wirelayer-css`)        |
| http://localhost:8081 | Expo demo app (web) – port configurable via `EXPO_PORT` |
| http://localhost:3000 | Nuxt demo app (`docker compose --profile apps up`)      |
| http://localhost:3001 | Next.js demo app (`docker compose --profile apps up`)   |

Commands, the workflow for new components and the Definition of Done: [CONTRIBUTING.md](CONTRIBUTING.md). Background:
[architecture and decisions](docs/architecture.md), [accessibility](docs/accessibility.md),
[implementation notes](docs/implementation-notes.md), [roadmap and known limitations](docs/roadmap.md).

```
packages/
  tokens/       @wirecore/wirelayer-tokens        design tokens (TS) → generated Tailwind v4 theme (theme.css), local fonts
  recipes/      @wirecore/wirelayer-recipes       tailwind-variants recipes (the only place with Tailwind classes)
                                                  + framework-free logic, /native (React Native recipes), /locales/<code>
  vue/          @wirecore/wirelayer-vue           Vue 3 components (Ark UI Vue + recipes)
  react/        @wirecore/wirelayer-react         React components (Ark UI React + recipes), same API and subpaths
  native/       @wirecore/wirelayer-native        React Native components (Expo, Uniwind + recipes/native)
  css/          @wirecore/wirelayer-css           .wc-* classes for HTML/server templates, generated from the recipes
  blocks-vue/   @wirecore/wirelayer-blocks-vue    page blocks and ConditionBuilder for Vue
  blocks-react/ @wirecore/wirelayer-blocks-react  page blocks and ConditionBuilder for React
  mcp/          @wirecore/wirelayer-mcp           MCP server for AI assistants (component API, guides) + llms.txt
  parity/       (private)                         tests: Vue/React parity, behavior, a11y (jsdom + browser)
apps/
  storybook/    (private)                         Storybook host: docs + composition of all framework Storybooks
  expo/ nuxt/ next/ (private)                     demo apps
```

### React Native on a device

The Expo app (`apps/expo`) runs as a web version in the container. For iOS/Android with Expo Go, the phone has to reach
the Metro server – easiest locally outside Docker: `pnpm --filter @wirecore/wirelayer-expo-demo start` (run
`pnpm build` first, Metro reads the built packages).

## License

[MIT](LICENSE) – Copyright (c) 2026 WireCore GmbH. The exception are the fonts Schibsted Grotesk and JetBrains Mono
shipped with `@wirecore/wirelayer-css`: they are licensed under the SIL Open Font License 1.1 (`dist/fonts/OFL.txt`).
Bundled third-party content and the licenses of the peer dependencies: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
Contributing: [CONTRIBUTING.md](CONTRIBUTING.md), [Code of Conduct](CODE_OF_CONDUCT.md), security issues:
[SECURITY.md](SECURITY.md).
