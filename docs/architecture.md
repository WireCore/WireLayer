# Architecture and decisions

## Goals

- One look, one API – usable in **Vue 3 / Nuxt**, **React / Next.js**, **React Native / Expo** and **plain HTML /
  server templates** (Blade, Twig, Astro …)
- Built on **Tailwind CSS v4** – the tokens are a Tailwind theme, the components consist of utilities
- **TypeScript** throughout (strict)
- Accessible according to **WCAG 2.2 AA** – the components bring ARIA, focus handling, contrast and so on with them
  (see [accessibility.md](accessibility.md))
- Forms and tables with **TanStack** (Form, Table, Virtual) – optional, never a required dependency
- Every package action runs in **Docker** – `docker compose up` and everything is available on `localhost`
- **Open source** under the MIT license

## Decisions

| Topic                 | Decision                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name                  | Product name **WireLayer** (previously WireCore; the short form WireUI was dropped because of the Laravel project WireUI); packages `@wirecore/wirelayer-*`, technical identifiers stay – see [Naming](#naming)                                                                                                                                                                                 |
| License               | MIT, “Copyright (c) 2026 WireCore GmbH”; `LICENSE` in the root and in every published package. Dependencies only with permissive licenses, checked by `pnpm licenses:check`; `@wirecore/wirelayer-css` ships the OFL text of the fonts and Tailwind's MIT notice ([THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md))                                                                          |
| Package scope         | `@wirecore/wirelayer-*` (npm organization `wirecore`), published publicly on npm                                                                                                                                                                                                                                                                                                                |
| Architecture          | Layered: tokens → recipes → CSS classes / framework wrappers                                                                                                                                                                                                                                                                                                                                    |
| Language              | TypeScript 6.0, configuration compatible with TS 7 (see [TypeScript](#typescript))                                                                                                                                                                                                                                                                                                              |
| Headless base (web)   | [Ark UI](https://ark-ui.com) (Zag.js) – the same API and behavior in Vue and React                                                                                                                                                                                                                                                                                                              |
| Variants              | [tailwind-variants](https://www.tailwind-variants.org) – framework-neutral, also usable in React Native                                                                                                                                                                                                                                                                                         |
| Vue and React         | Developed side by side, API parity from day one                                                                                                                                                                                                                                                                                                                                                 |
| CSS classes (`.wc-*`) | **Generated** from the recipes, never maintained by hand                                                                                                                                                                                                                                                                                                                                        |
| TanStack              | Form bindings and DataTable as subpaths with an optional peer dependency (`@wirecore/wirelayer-vue/form`, `@wirecore/wirelayer-react/data-table` …) · Virtual for long lists · DataTable feature modules (`features`): `virtualRows` from `/virtual`, `dateInput`/`numberInput` – only what a table gets ends up in the bundle                                                                  |
| Third-party libraries | Only as optional peer dependencies behind their own subpaths (`/chart`, `/editor`, `/code`, `/pdf` …); MIT-compatible license, no pro/commercial packages (`@tiptap-pro/*`, `uniwind-pro`)                                                                                                                                                                                                      |
| Icons                 | Lucide: `@lucide/vue` (successor of `lucide-vue-next`), `lucide-react`, `lucide-react-native`                                                                                                                                                                                                                                                                                                   |
| Fonts                 | Local via `@fontsource-variable/*` – no Google Fonts CDN (GDPR)                                                                                                                                                                                                                                                                                                                                 |
| Docs and tests        | Storybook                                                                                                                                                                                                                                                                                                                                                                                       |
| Dev environment       | Docker Compose (Node 26, LTS from the end of October 2026 · pnpm 12)                                                                                                                                                                                                                                                                                                                            |
| Styling rule          | Tailwind classes only in `@wirecore/wirelayer-recipes` – components contain no classes of their own                                                                                                                                                                                                                                                                                             |
| CSS size              | `styles.css` lets Tailwind scan all recipes (nothing can be missing, ~175 kB). Opt-in `styles-core.css` + `sources/<Component>.css` / `sources/<recipe>.css`: only the classes of what an app uses; generated by `scripts/sources.ts` from the recipe objects and the imports of the components, checked by `parity/src/sources.test.ts`, missing imports warn in development (`--wc-recipe-*`) |
| Themes                | Color presets as in PrimeVue: `data-theme` (WireLayer = `wirecore`, Ocean, Violet, Teal) × `data-mode` (light/dark, without it the system setting); `primary` drives primary buttons and selected states; custom themes with `defineTheme`/`themeToCss`/`checkTheme`                                                                                                                            |
| Animations            | Opening/closing of overlays (Dialog, Menu, Select, Tooltip, Toast), only with `motion-safe`                                                                                                                                                                                                                                                                                                     |
| Parity                | `packages/parity` renders every component in Vue **and** React, compares the DOM and tests the behavior in both                                                                                                                                                                                                                                                                                 |
| React Native          | `@wirecore/wirelayer-native` with Uniwind (Tailwind v4); RN recipes under `@wirecore/wirelayer-recipes/native`; Expo SDK 58                                                                                                                                                                                                                                                                     |
| Imports               | Relative imports with a `.js` extension (correct `.d.ts`), `.vue` for SFCs, `.ts` only in Node scripts                                                                                                                                                                                                                                                                                          |
| React Native headless | No headless library (`@rn-primitives` is not used) – own components on Pressable, Modal … and the recipes                                                                                                                                                                                                                                                                                       |
| Browser target        | Tailwind v4 requires Safari 16.4+, Chrome 111+ and Firefox 128+ (official support is not defined yet, see [roadmap.md](roadmap.md))                                                                                                                                                                                                                                                             |
| AI tooling            | `@wirecore/wirelayer-mcp` and `llms.txt` live in this repository and are published with the packages. The MCP server is called `wirelayer`, the command `wirelayer-mcp` (alias `wirecore-mcp`)                                                                                                                                                                                                  |
| Code languages        | `/code` loads only `shiki/core` and a fixed list of grammars with an MIT/TextMate license (`codeLanguages`); C++ is missing (it embeds the unlicensed GLSL grammar). More languages via `languages` – their license is then up to the user; without them, C++ or Ruby for example appear uncolored                                                                                              |
| Markdown              | Own small renderer (`markdownElements`) returns element descriptions that Vue/React render as VNodes/elements – never `v-html`/`dangerouslySetInnerHTML`; only http(s)/mailto/tel/relative links, images become links                                                                                                                                                                           |
| UI languages          | English (default) built in; de, fr, es, it, pt, pt-BR, nl, pl, cs, hu, lv, ar, tr as separate modules (`…/locales/<code>`), via `registerLocale` or `translations` – not in the default bundle. The texts are machine-translated; review by native speakers is open                                                                                                                             |
| PDF                   | `/pdf`: own viewer on `pdfjs-dist` (Apache-2.0, legacy build, optional peer dependency); EmbedPDF was rejected (no text layer for screen readers, WASM from a CDN); React Native on react-native-pdf (development build)                                                                                                                                                                        |
| Numbers in texts      | `LocaleProvider` passes the texts through `localizeTexts`: digits of the locale (Arabic-Indic in `ar-EG`), grouping from 10,000; Latin tokens (Q1, F6), date parts and texts passed in stay as they are                                                                                                                                                                                         |
| Server data           | Two ways with the same names: manual (`loadMore`, `filterChange`, `loading`, `hasMore` …) or `dataSource`; older names that differ remain as deprecated aliases (overview under [Server data and loading more](#server-data-and-loading-more))                                                                                                                                                  |
| React Native, part 3  | DataTable without TanStack (`@wirecore/wirelayer-native/data-table`, own logic in `table-view.ts`); charts with react-native-svg instead of Chart.js (`/chart`); PdfViewer on react-native-pdf (`/pdf`, dev build); CodeHighlight with shiki/core + the JS RegExp engine (`/code`); export/sharing via `/expo-sharing`; no rich text editor                                                     |
| Blocks                | `@wirecore/wirelayer-blocks-*` depend on `@wirecore/wirelayer-vue`/`react` as a peer, never the other way round: the ConditionBuilder lives there, the DataTable receives it from outside (`renderAdvancedFilter`/`#advancedFilter`; without it: no button, dev warning). React Native keeps it in `@wirecore/wirelayer-native` (no blocks package for RN)                                      |
| Deliberately left out | Dock, Terminal, DeferredContent, KeyFilter, floating labels (FloatLabel/IftaLabel) and the PrimeVue directives                                                                                                                                                                                                                                                                                  |

### Naming

The **product name** was changed in all readable texts (docs, Storybook, story texts, comments, `description` fields,
MCP server and `llms.txt`, demo apps, sample PDFs, iCal `PRODID`, theme label) and in the **package names**
(`@wirecore/<name>` → `@wirecore/wirelayer-<name>`, including the private packages and apps). Deliberately **kept** –
stable technical API that matches the scope `@wirecore`, or infrastructure:

- CSS: classes `.wc-*`, variables `--wc-*`, file `wirecore.css` (`@wirecore/wirelayer-css/wirecore.css`)
- Theme name `wirecore` (`data-theme`, `setAppearance`, `nativeThemeName`, internal Shiki theme name) – displayed as
  “WireLayer”
- Export condition `wirecore:source`
- Stored keys and events: `wirecore-mode`, `wirecore-emoji-recent`, `wirecore-table:<key>`, `wirecore-storage`;
  Storybook: `wirecore-appearance`, `wirecore:appearance(-request)`, addon ID `wirecore/appearance`, story keys
  `wirecore-story-*`
- Data formats: `application/x-wirecore-event` (dragging into the Scheduler), iCal
  `X-WIRECORE-TONE/-RESOURCE/-BACKGROUND`, `vendor: 'wirecore'` of the validators (Standard Schema)
- Vue injection symbols `Symbol('wirecore-…')` (debug names only)
- Docker: Compose project `wirecore` (container and volume names), image `wirecore-node:dev`; environment variables
  `WIRECORE_STORYBOOK_*_URL` and `WIRECORE_<STORYBOOK>_URL/_BUILD` (Playwright)
- MCP command `wirecore-mcp` (alias next to `wirelayer-mcp`), Expo slug `wirecore-demo`
- Sample data: domains `wirecore.de`/`wirecore.dev`, CLI `wirecore …` in story texts, PDF password `wirecore`, IDs in
  test data

## Packages

```
@wirecore/wirelayer-tokens        Colors, radii, typography, size grid, fonts, themes (single source of truth)
   │                      → CSS variables · Tailwind v4 theme · TS export for RN
   ▼
@wirecore/wirelayer-recipes       tailwind-variants definitions + framework-neutral logic (table, scheduler, charts,
   │                    data sources, texts …) · /native (RN recipes) · /locales/<code>
   │
   ├─► @wirecore/wirelayer-css     generated .wc-* classes for HTML & server templates (+ fonts with OFL.txt)
   ├─► @wirecore/wirelayer-vue     Ark UI Vue    + recipes + Lucide
   │      ├─ /form         TanStack Form, validators    (optional)
   │      ├─ /data-table   TanStack Table               (optional)
   │      ├─ /virtual      TanStack Virtual, virtualRows (optional)
   │      ├─ /chart        Chart.js                     (optional)
   │      ├─ /editor       Tiptap                       (optional)
   │      ├─ /code         Shiki (shiki/core + language allowlist, optional)
   │      ├─ /pdf          pdf.js (pdfjs-dist, optional)
   │      └─ /locales/<code>  language modules (fr, es, it, pt, pt-BR, nl, pl, cs, hu, lv, ar, tr)
   ├─► @wirecore/wirelayer-react   Ark UI React  + recipes + Lucide, same subpaths
   ├─► @wirecore/wirelayer-blocks-vue / blocks-react   page blocks (SiteHeader, CtaSection, ModeToggle, AuthForm,
   │                    AuthLayout) and ConditionBuilder · peer on @wirecore/wirelayer-vue|react, never the other way round
   └─► @wirecore/wirelayer-native  Uniwind + recipes (/native) + React Native building blocks (Pressable, Modal …)
          ├─ /form         TanStack Form                (optional)
          ├─ /data-table   own table logic, without TanStack
          ├─ /chart        react-native-svg
          ├─ /pdf          react-native-pdf + react-native-blob-util (development build)
          ├─ /code         Shiki (JavaScript RegExp engine)
          ├─ /expo-sharing · /expo-clipboard · /expo-document-picker · /expo-image-picker
          └─ /locales/<code>

@wirecore/wirelayer-mcp           MCP server `wirelayer` + llms.txt for AI assistants (generated from source and stories)
apps/storybook          Storybook host, composes the Vue, React, React Native and HTML Storybooks
apps/nuxt · apps/next · apps/expo   demo apps
packages/parity         tests: DOM comparison + behavior for Vue and React, E2E, visual tests, axe (private)
scripts/check-licenses.ts   license check of the published packages (pnpm licenses:check)
```

## Server data and loading more

Pattern and example: Storybook › Getting started, section “Server data and loading more”. (a) manual: events +
`loading`/`hasMore`/`totalCount`, (b) `dataSource` (`recipes/data-source.ts`), (c) loading more. Shared names:
`loadMore`, `loading`, `hasMore`, `filterChange`, `manualFilter`, `pageChange`, `loadChildren`.

| Component                                   | (a) manual                                                         | (b) `dataSource`                     | (c) loading more         |
| ------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------ | ------------------------ |
| Select, MultiSelect, Combobox, Autocomplete | ✓ `filterChange`, `manualFilter`, `loadMore`, `hasMore`, `loading` | ✓ incl. `getItemsByKeys`             | ✓ end of list            |
| Listbox                                     | ✓ like Select                                                      | ✓                                    | ✓ end of list            |
| VirtualSelect                               | ✓ like Select                                                      | ✓                                    | ✓ end of list            |
| TagsInput (suggestions)                     | ✓ like Select                                                      | ✓                                    | ✓ end of list            |
| Mentions                                    | ✓ `search`, `loading`                                              | ✓ per trigger                        | –                        |
| CommandPalette                              | ✓ `filterChange` (`search` deprecated), `loading`, `filter=false`  | ✓                                    | –                        |
| VirtualList                                 | ✓ `loadMore` (`endReached` deprecated), `loading`, `hasMore`       | ✓                                    | ✓ scrolling              |
| DataView                                    | ✓ `manual`, `totalCount`, `pageChange`, `loadMore`                 | ✓ pages or `loadMode: 'infinite'`    | ✓                        |
| DataTable                                   | ✓ `manual`, `rowCount`, `loadMore` (`scrollEnd` deprecated)        | ✓ `getRows`/`getItems`, `condition`  | ✓ pages, virtual         |
| Tree, VirtualTree                           | ✓ `loadChildren` event                                             | ✓ `getChildren`                      | ✓ children; reordering   |
| TreeSelect, CascadeSelect, OrgChart         | ✓ `loadChildren` event                                             | ✓ `getChildren`                      | ✓ children               |
| PickList                                    | ✓ source list: `filterChange`, `manualFilter`, `loadMore`          | – (labels of selected items)         | ✓ source list            |
| OrderList                                   | – (orders selected items)                                          | –                                    | –                        |
| Timeline (feed)                             | ✓ `loadMore`, `loading`, `hasMore`                                 | – open                               | ✓ “Load more”            |
| Kanban                                      | ✓ `loadMore(column)`, `hasMore`/`loading` per column               | – deliberately (cards are app state) | ✓ per column             |
| NotificationCenter                          | ✓ `loadMore`, `loading`, `hasMore`, `unreadCount`                  | ✓                                    | ✓ “Load more”            |
| LogViewer                                   | ✓ `loadMore`, `loading`, `hasMore`                                 | ✓ (older lines)                      | ✓ “Load older entries”   |
| ChatMessages                                | ✓ `loadMore`, `loading`, `hasMore`                                 | – open                               | ✓ older messages         |
| Gallery                                     | ✓ `loadMore`, `loading`, `hasMore`                                 | – open                               | ✓ at the last two images |
| Carousel                                    | ✓ `pageChange`                                                     | –                                    | –                        |
| Scheduler                                   | ✓ `rangeChange`, `loading`                                         | ✓ `range` of the view                | ✓ time range             |
| Gantt                                       | ✓ `loading`                                                        | – deliberately (tasks are app state) | –                        |
| Pagination                                  | ✓ `count`, `pageSize`, `pageChange` (control)                      | –                                    | –                        |

## TypeScript

**As of October 2026:**

- **TypeScript 6.0** (March 2026) is the last version on the old JavaScript compiler – a transition release that mainly
  deprecates options and changes defaults (`strict: true`, `module: esnext`, `types: []` …) to pave the way for 7.0.
- **TypeScript 7.0** (the Go port, 8–12× faster builds) has been stable since July 8, 2026 – **but without a
  programmatic API**. Everything that imports TypeScript as a library does not work with it yet: `vue-tsc` / Vue
  Language Tools, `typescript-eslint` (supports `<6.1`), Storybook docgen, `.d.ts` generators.
- **TypeScript 7.1** is supposed to deliver the API, planned for **November 24, 2026** (target date, no promise). Vue
  Language Tools v4 and typescript-eslint have to follow after that.

**Consequence:** For a Vue + React library, 7.0 is not usable today. We are on **TypeScript 6.0**, configured so that
moving to 7.x is only a version bump:

- `typescript@~6.0` as the only TS version in the workspace
- `tsconfig.base.json` without deprecated options: no `baseUrl`, no `downlevelIteration`, `moduleResolution: "bundler"`,
  `module: "esnext"`, `strict: true`, `verbatimModuleSyntax: true`
- Vue: `<script setup lang="ts">`, type checking via `vue-tsc`; React: `.tsx`, `ref` as a prop (React 19, without
  `forwardRef`); props types are exported
- Workaround if speed is needed before 7.1: alias setup `typescript` → `@typescript/typescript6`, `@typescript/native` →
  TS 7 (`tsc` = 7, `tsc6` = 6)
