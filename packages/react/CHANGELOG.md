# @wirecore/wirelayer-react

## 0.6.0

### Minor Changes

- 056ef12: Closes gaps found when moving an app from PrimeVue.

    **Changed default:** with `stateKey`, the DataTable no longer saves the selection (`stateExclude` defaults to
    `['selection']`); a selection saved earlier is not restored either. Pass `stateExclude: []` (Vue `:state-exclude="[]"`)
    to keep it as before.

    DataTable

    - `resetFilters()` and `resetState()` (filters, search, page; plus sorting back to `defaultSorting`, no selection,
      saved state forgotten); `filterReset` adds a "Reset filters" button to the toolbar
    - Column `filterInputProps` (`placeholder`, `filter`, `maxShown`, `clearable`) for the built-in filter inputs, and an own
      option template: Vue `#option-<id>`, React `renderOption` (also for select editors); choices can have `keywords`
    - `selectedRows` – the selection as row objects, both ways (Vue `v-model:selected-rows`, React with
      `onSelectedRowsChange`)
    - `stateExclude` – parts of the state that `stateKey` does not keep; `showFilters` is saved now
    - Column `cellClass` (a text or per row), `headerClass` and `headerHidden` (header text for screen readers only)
    - `rowKeywords` – more text the search finds a row by, e.g. fields without a column
    - Fixed (Vue): controlled props are compared by value – an equal copy (inline in the template, from a computed) no
      longer resets the user's sorting, page or filters; a new page no longer resets the rows per page the user chose (so
      the saved `pageSize` sticks)

    Forms and lists

    - Select, MultiSelect, Combobox: an item with the value `null` (e.g. "All") is a choice of its own; `itemKeywords` –
      the search also finds items by other fields (items can bring `keywords`)
    - Field (Vue): slots `#label`, `#helper-text`, `#success`, `#error`, part of the control's description; FormField
      passes them on
    - SegmentedControl, RadioGroup, ChipGroup inside a Field: named by its label, described by its texts; SegmentedControl
      `label` is optional there; SegmentedControl stays as wide as its segments in a column (e.g. a Field)
    - DatePicker, DateRangePicker, MonthPicker, YearPicker: `placeholder` while the field is empty and not focused
    - FileUpload: `showFileList` and the chosen files controlled (Vue `v-model:files`, React `files` with `onFilesChange`)

    Buttons, overlays, charts

    - `iconProps` on IconButton, Button, Badge and ToggleButton (e.g. `{ fill: 'currentColor' }`); ToggleButton
      `pressedIcon` and `pressedIconProps`
    - Toaster: `placement`, `max`, `overlap` and `gap` – also for the app-wide toaster of `toast()`
    - Chart: `plugins` (inline Chart.js plugins); `data`/`options` take their type from `type` only; the Chart.js types
      `ChartData`, `ChartOptions`, `ChartType` and `ChartPlugin` come from `/chart`
    - DialogContent: the sizes set `--wc-dialog-w` – another width without `size`, e.g. `style="--wc-dialog-w: 36rem"`
      (same look as before)

    Docs and AI: llms-full.txt and the MCP server list the Vue components' own props (defineProps, defineModel) – e.g. Card
    `title` and Field `label`/`helperText`/`error` were missing; DialogContent, DrawerContent and EmptyState declare their
    slots. React Native: lists find items by their `keywords`, too.

### Patch Changes

- Updated dependencies [056ef12]
    - @wirecore/wirelayer-recipes@0.5.0

## 0.5.0

### Minor Changes

- 9fbee02: The packages ship `llms.txt` (overview with links) and `llms-full.txt` (every component with props, examples as
  Storybook links, the functions and the guides) for AI assistants, written by the build from the same data as the MCP
  server and matching the installed version – in each package's own syntax: Vue with `v-model`, events and slots, React
  with props and render props, React Native, and for `@wirecore/wirelayer-css` a reference of all `.wc-*` classes with
  parts, modifiers and defaults. Point an assistant at `node_modules/@wirecore/wirelayer-vue/llms.txt`.

### Patch Changes

- 9fbee02: Avatar `as="button"` hovers like the IconButton with the same look, so triggers side by side in a bar (app switcher,
  user menu) behave alike: `outline` darkens its border, `soft` its background (like `secondary`), `solid` fades like the
  filled variants, a `color` tint gets stronger (14 % → 18 %). The ring on hover and while the menu is open is gone –
  only an avatar showing an image without a border (soft, solid) keeps a ring on hover, where the background change
  would be hidden. New TopBar story with both triggers.
- Updated dependencies [9fbee02]
    - @wirecore/wirelayer-recipes@0.4.1

## 0.4.0

### Minor Changes

- b46176b: Avatar `as="button"`: the avatar as a button, e.g. the trigger of a user menu (`<Menu><Avatar as="button" name="…" />
  </Menu>`), with the focus ring of the other buttons and a ring on hover and while its menu is open (avatar recipe:
  variant `interactive` and slot `content`, `.wc-avatar-interactive`). The button is named by an image inside it that
  carries `name`, so the visible initials do not have to be part of an aria-label (WCAG 2.5.3 label in name). An explicit
  `aria-label` on an avatar that is not a button now wins over `name`.
- b46176b: Menu: `placement` (the values of Popover, default `bottom-start` as before), e.g. `bottom-end` for a user menu at the
  right edge, and `arrow` for an arrow at the trigger, styled like the Popover's (menu recipe: slots `arrow` and
  `arrowTip`).
- b46176b: Fix: `linkAs` works with routers that need `to` – vue-router's `RouterLink`, React Router and TanStack Router `Link`.
  Menu, ContextMenu and Menubar items, BottomNavigation items and the MegaMenu links take `to` (a path or a route object);
  the link component then gets `to` instead of `href`. Without `to` nothing changes (`href` for NuxtLink, Next.js Link
  or `<a>`). MegaMenu also has `moreTo` and `allTo` for its "Show all" links; `href` still identifies a link for
  `currentHref`. Recipes: `linkTarget(href, to)` and the type `LinkTo`.
- b46176b: PopoverContent: `hideTitle` keeps the title for screen readers only (it still names the panel) and `closable={false}`
  drops the close button, e.g. for an app switcher. Popover recipe: variant `hideTitle`. Fix (React): a PopoverContent
  without `description` no longer points `aria-describedby` at a description that does not exist.
- b46176b: One corner radius for all floating surfaces: the new token `--radius-popup` (12px, class `rounded-popup`) is used by
  Menu, ContextMenu, Menubar menus, the option lists of Select, MultiSelect, Combobox, Autocomplete, TagsInput, Mentions,
  CascadeSelect and TreeSelect, Popover, HoverCard, ConfirmPopup, Tour, DatePicker, ColorPicker, the DataTable filter
  panel, NavigationMenu, MegaMenu, FloatingPanel and the editor's bubble menu and mention list. Visible change: menus and
  option lists go from 10px to 12px (their items from 6px to 8px, so the corners stay concentric), the editor's menus
  from 8px to 12px; the panels already had 12px. Tooltip, Toast and Dialog keep their radius. A theme can set
  `--radius-popup` to change all of them at once.
- b46176b: Collection props take read-only arrays (`readonly T[]`), like Select already did: DataTable `data` and `columns`, the
  `items` of Menu, Tree, Steps, Breadcrumb, Timeline, Carousel and the other list components, chart `data` and `series`,
  Menubar `menus`, Scheduler `events` and many more – data from an API client no longer has to be copied. Props that are
  written back (`v-model:*` / `on…Change`, e.g. `modelValue`, `selectedValue`, Kanban `columns`) and the nested
  `children` of trees and column groups stay mutable. The recipe helpers that read such lists (Gantt, scheduler,
  notifications, `rankItems`, `filterMenuEntries`, `withLoadedChildren`, …) take read-only arrays as well.
- b46176b: New TopBar: a slim app header outside AppShell (`<header>`) with `start`, the middle (default slot / children, takes
  the free space) and `end` – without menus and without the toolbar's arrow-key navigation (recipe `topBar`,
  `.wc-top-bar`).

### Patch Changes

- b46176b: Docs: `bindInput` lists every component it fits – in Vue all components with a string `v-model` (Input, Textarea,
  PasswordInput, SearchField, MaskInput, PhoneInput, ColorInput, JsonInput, PinInput, Mentions, Autocomplete), in React
  Input, Textarea and PasswordInput (the others report their text with `onValueChange` and take `bindValue`). The READMEs
  point to the MCP server `@wirecore/wirelayer-mcp` and llms.txt; the component packages ship no llms.txt.
- Updated dependencies [b46176b]
- Updated dependencies [b46176b]
- Updated dependencies [b46176b]
- Updated dependencies [b46176b]
- Updated dependencies [b46176b]
- Updated dependencies [b46176b]
- Updated dependencies [b46176b]
    - @wirecore/wirelayer-recipes@0.4.0
    - @wirecore/wirelayer-tokens@0.3.0

## 0.3.1

### Patch Changes

- 9c4aa96: Fix: the sources files of `styles-core.css` brought the classes of all recipes with automatic source detection
  (`@import 'tailwindcss'`) – Tailwind scans the whole folder of a file that an `@source` in `node_modules` points to,
  and the class lists of all recipes were files in one folder. `sources/<recipe>.css` now contains the classes as
  `@source inline()`; the imports stay the same. Tailwind CSS 4.1 or newer is required (`@source inline()`, and
  `@source not`, which `styles.css` already used): the peer dependency is now `^4.1.0`.
- Updated dependencies [9c4aa96]
    - @wirecore/wirelayer-recipes@0.3.1

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
- Updated dependencies [3226614]
    - @wirecore/wirelayer-tokens@0.1.0
    - @wirecore/wirelayer-recipes@0.1.0
