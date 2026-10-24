# @wirecore/wirelayer-vue

## 0.3.0

### Minor Changes

- 5e0740a: Smaller CSS for apps that use only a few components (opt-in, `styles.css` is unchanged): `styles-core.css` brings the
  theme and the fonts without the classes of the components, which an app then imports per component it uses –
  `@wirecore/wirelayer-vue/sources/Button.css`, `@wirecore/wirelayer-blocks-vue/sources/SiteHeader.css` (also the
  React packages) – or per recipe it calls itself: `@wirecore/wirelayer-recipes/sources/card.css`. The file of a component
  brings the classes of the components it renders as well. A site with a header, buttons, cards and prose shrinks from
  about 184 kB (29 kB gzip) to 47 kB (10 kB gzip). In development the components warn when the classes of a recipe they
  render are missing (`checkRecipeSources` in the recipes).

### Patch Changes

- Updated dependencies [5e0740a]
    - @wirecore/wirelayer-recipes@0.3.0

## 0.2.0

### Minor Changes

- 54609a3: DataTable: new prop `csvSeparator` for the CSV export, also for the built-in export button. By default the separator
  now follows the locale like a spreadsheet does (`csvSeparator(locale)` from the recipes): `;` where numbers have a
  decimal comma (de-DE, fr-FR …), `,` otherwise (en-US …). Before, it was always `;`. `exportCsv({ separator })` still
  wins over both.
- b7530a8: **Breaking:** DataTable feature modules. Parts of the DataTable that bring a lot of code along are imported on their own
  and passed in `features` – a minimal table is about a fifth smaller (gzip), and `@tanstack/vue-virtual` or
  `@tanstack/react-virtual` is only needed for virtual rows.

    - `virtual` needs the feature `virtualRows` from `/virtual`; without it all rows are rendered (with a hint in
      development).
    - Date and number filters and editors use the browser's inputs; the DatePicker and NumberInput come with the features
      `dateInput` and `numberInput` from `/data-table`.

    ```tsx
    import { DataTable, dateInput, numberInput } from '@wirecore/wirelayer-react/data-table'; // or -vue
    import { virtualRows } from '@wirecore/wirelayer-react/virtual';

    const features = [virtualRows, dateInput, numberInput];

    <DataTable data={rows} columns={columns} features={features} scrollHeight="480px" virtual />;
    ```

- 54609a3: **Breaking:** German is a language module like French or Spanish and no longer part of the default bundle (about half
  of the built-in texts). Only English is built in. Apps that use German register it once at startup, before the first
  render:

    ```ts
    import { registerLocale } from '@wirecore/wirelayer-vue'; // or -react, -native
    import { de } from '@wirecore/wirelayer-vue/locales/de';

    registerLocale('de', de);
    ```

    `messages` only contains `en` now; the German texts are `de` from `…/locales/de`. The German names and search words of
    the EmojiPicker moved there as well (`emojiPicker.emojis`); the built-in emojis are English. `localeEmojis(texts)` no
    longer takes a locale – pass the lines of the language module (`localeEmojis(de.emojiPicker.emojis)`).

- bbb430c: The types that appear in the props are exported by the component packages themselves, so apps no longer need
  `@wirecore/wirelayer-recipes` (or `NonNullable<BadgeProps['variant']>`) for them – e.g. `BadgeVariant`,
  `ButtonVariant`, `ButtonSize`, `AlertStatus`, `DialogPosition`, `OverlaySize`, `StatusDotStatus`, `DataSource`,
  `RecipeClasses`. `/data-table` adds `PivotValue`, `/virtual` `ItemAccessor`, React Native's `/pdf` `PdfZoom`.

### Patch Changes

- 1ccb5ce: **Behavior change:** without `data-mode` the page now follows the system setting (`prefers-color-scheme`) instead
  of always being light. `data-mode="light"` or `data-mode="dark"` forces a mode as before, also for a part of the page
  (a forced light part stays light on a dark system).

    - The `dark:` variant follows the same rules, and so do the dark colors of the built-in themes and of custom themes
      generated with `themeToCss`.
    - Charts (Chart, ChartCanvas, Sparkline) recolor when the system setting changes.
    - Apps that relied on "no attribute = light" and want to keep it: set `data-mode="light"` on `<html>`. Apps that set
      `data-mode` from `prefers-color-scheme` with JavaScript can drop that.

- 54609a3: Documentation says English is the default language, as it is in the code: `useLocale` and the MCP server/`llms.txt`
  no longer claim German without a `LocaleProvider`.
- 4ec36ef: `bindInput` from `/form` fits `Input` and `Textarea` in compiled SFC templates: `onUpdate:modelValue` accepts
  `string | undefined` (what the components emit) and `modelValue` falls back to `''`, like the React variant. Before,
  `<Input v-bind="bindInput(field)" />` was a vue-tsc error.
- Updated dependencies [1ccb5ce]
- Updated dependencies [54609a3]
- Updated dependencies [54609a3]
- Updated dependencies [54609a3]
    - @wirecore/wirelayer-tokens@0.2.0
    - @wirecore/wirelayer-recipes@0.2.0

## 0.1.1

### Patch Changes

- 1cbdeda: Every package has a README on npm now (installation, usage, links to Storybook and GitHub).
- Updated dependencies [1cbdeda]
    - @wirecore/wirelayer-tokens@0.1.1
    - @wirecore/wirelayer-recipes@0.1.1

## 0.1.0

### Minor Changes

- 3226614: First public release of WireLayer under the MIT license.

    - **Components (Vue and React):** around 180 components with an identical API and identical DOM – among them selection
      lists with arbitrary values, groups, search and loading more; date and time pickers (QuarterPicker, TimeRangePicker,
      DurationInput, TimeGrid, MiniCalendar); overlays, menus, MegaMenu, AppShell with rail and resizing, layout building
      blocks, Banner, NotificationCenter, Statistic, Persona, Wizard, FilterPanel, QrCode, SignaturePad, ImageCropper,
      FloatingPanel, JsonViewer/JsonInput, EmojiPicker, Mentions, PhoneInput, Sortable, LogViewer, Kanban, chat building
      blocks, Markdown, SessionTimeout, Scheduler (resources, timeline, recurrences, iCalendar, time zones) and Gantt;
      hooks/composables; `RecipesProvider` and `classes` for customization.
    - **DataTable:** filter and column menus, grouping, pivot, tree rows, cell ranges with copy/paste, editing with undo,
      Excel/CSV export, printing, virtual scrolling and a server data source; advanced filter (`advancedFilter`) with a
      condition tree whose editor the table receives via `renderAdvancedFilter` (React) or the slot `#advancedFilter` (Vue).
    - **Blocks (`@wirecore/wirelayer-blocks-vue`, `@wirecore/wirelayer-blocks-react`):** SiteHeader, CtaSection,
      ModeToggle, AuthForm, AuthLayout and the **ConditionBuilder** (nested AND/OR rules).
    - **Server data:** shared names (`loadMore`, `loading`, `hasMore`, `filterChange`, `manualFilter`) and `dataSource` for
      lists, trees, tables and the Scheduler.
    - **Subpaths with optional peers:** `/form` (TanStack Form, validators, FormList), `/data-table` (TanStack Table),
      `/virtual`, `/chart` (Chart.js), `/editor` (Tiptap), `/code` (Shiki with a vetted language list), `/pdf` (PdfViewer
      on pdf.js).
    - **Languages:** English (default) and German built in; `registerLocale` and language modules under
      `…/locales/<code>` for fr, es, it, pt, pt-BR, nl, pl, cs, hu, lv, ar and tr; numbers in texts follow the locale,
      right-to-left support.
    - **React Native (`@wirecore/wirelayer-native`):** around 145 components with the prop names of the web – forms,
      display, feedback, overlays as sheets, navigation without a router, hooks, data and complex building blocks; subpaths
      `/form`, `/data-table`, `/chart` (react-native-svg), `/pdf`, `/code`, `/expo-sharing`, `/expo-clipboard`,
      `/expo-document-picker`, `/expo-image-picker` and `/locales/<code>`.
    - **HTML (`@wirecore/wirelayer-css`):** `.wc-*` classes generated from the recipes for everything that works without
      JavaScript; the font license (`dist/fonts/OFL.txt`) and Tailwind's license notice are included.
    - **Tokens:** colors, radii, typography, size grid, local fonts and themes (WireLayer, Ocean, Violet, Teal) with
      contrast-checked tints.
    - **MCP (`@wirecore/wirelayer-mcp`):** MCP server `wirelayer` (command `wirelayer-mcp`) and `llms.txt` with the
      component API and guides for AI assistants.

### Patch Changes

- 22b4b37: Menu, ContextMenu and other anchored overlays keep the focus when they are opened again right after closing: the
  delayed focus return of the previous close no longer pulls the focus out of the reopened popup.
- e7e5e18: Menus with submenus, Menubar and CascadeSelect no longer freeze in production builds: positioning options are no
  longer passed to Ark as a new object on every render.
- Updated dependencies [3226614]
    - @wirecore/wirelayer-tokens@0.1.0
    - @wirecore/wirelayer-recipes@0.1.0
