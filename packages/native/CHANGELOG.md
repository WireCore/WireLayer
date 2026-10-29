# @wirecore/wirelayer-native

## 0.5.0

### Minor Changes

- ed18228: `Alert` takes actions – Vue slot `#actions`, React and React Native prop `actions` – e.g. "Workspace locked –
  [Unlock]": beside the text, below it when there is little room (React Native: below the text). Recipe slots `text` and
  `actions`, variant `hasActions`; without actions the DOM stays as it was.
- ed18228: `DialogContent` (React Native: `Dialog`) takes `titlePosition: 'body' | 'header'` (default `body`, as before). With
  `header` the title sits in the row of the close and maximize buttons, after a smaller icon, the header separated by a
  line – as on the Drawer; a long title wraps. Recipe variant `titleInHeader` for `dialog` (HTML: `wc-dialog-title-in-header`).
- ed18228: `mono` on `Input`, `PasswordInput` and `Textarea` (default `false`): the theme's monospace font (JetBrains Mono) for
  paths, tokens, recovery codes, URLs and keys. Recipe variant `mono` for `input`, `passwordInput` and `textarea`.
- ed18228: Compact `Progress` for lists and status bars, all opt-in:

    - `size: 'xs' | 'md'` – `xs` is a thin bar with small text
    - `status: 'info' | 'success' | 'warn' | 'danger'` colours the fill
    - `hideLabel`: the label only names the bar for screen readers
    - `barText`, e.g. "42 %", "waiting" or "failed": text in a taller bar (horizontal, without segments or steps), readable
      over the empty and the filled part; screen readers get it after the value

- ed18228: Typed values for choice components, inferred from the bound value; without one the types stay as they were:

    - `RadioGroup` and `SegmentedControl` take a value type (`RadioGroup<'ssh' | 'sftp'>`, Vue `generic`), so a union comes
      back from v-model / `onValueChange` without mapping
    - `RadioGroup` and `NativeSelect` also take number values (`RadioGroupItem :value="30"`, `items: [{ value: 30, … }]`)
      and give them back as numbers; NativeSelect's placeholder option still gives `''`
    - `Checkbox` takes the state type from `checked`/`defaultChecked`: a boolean model gets `boolean` back, not
      `boolean | 'indeterminate'`

    The rendered DOM does not change. Note for type code around the components: the Vue components are generic now, so
    `InstanceType<typeof RadioGroup>` and Storybook's `Meta<typeof RadioGroup>` need a cast (as for Select); in React,
    `ComponentProps<typeof RadioGroup>` / `NativeSelect` see `string | number` values (`typeof NativeSelect<string>` names
    the old props).

### Patch Changes

- Updated dependencies [ed18228]
- Updated dependencies [ed18228]
- Updated dependencies [ed18228]
- Updated dependencies [ed18228]
- Updated dependencies [ed18228]
    - @wirecore/wirelayer-recipes@0.7.0

## 0.4.0

### Minor Changes

- e7ecc8e: ConfirmDialog: `confirmButton` and `cancelButton` (Vue `confirm-button`, `cancel-button`) set the look of its buttons
  for every request – `{ variant, color, size, shape }` as on Button; the same options in `confirm()` and `prompt()` win
  for one request. The defaults stay: size sm, cancel `outline`, confirm `primary` (`danger` with status danger). New
  type `ConfirmButtonOptions`.
- e7ecc8e: IconButton `loading`, like Button: a spinner instead of the icon, the name stays; the button stays focusable
  (`aria-disabled`, `aria-busy`) and ignores clicks – it does not submit its form either.
- e7ecc8e: Smaller additions, the defaults stay:

    - Slider `hideLabel`: the label is for screen readers only – it still names the thumbs; without `showValue` the header
      takes no room (also in React Native, where the thumbs keep the label as their name)
    - Carousel `controlsPosition: 'bottom' | 'sides'` (default `bottom`): with `sides` previous and next sit beside the
      slides, vertically centred; autoplay and dots stay below
    - Tooltip `closeOnScroll` (default `true`, as before): `false` keeps it open while the page or a container around the
      trigger scrolls

### Patch Changes

- Updated dependencies [e7ecc8e]
- Updated dependencies [e7ecc8e]
- Updated dependencies [e7ecc8e]
- Updated dependencies [e7ecc8e]
- Updated dependencies [e7ecc8e]
- Updated dependencies [e7ecc8e]
- Updated dependencies [e7ecc8e]
- Updated dependencies [e7ecc8e]
- Updated dependencies [e7ecc8e]
- Updated dependencies [e7ecc8e]
- Updated dependencies [e7ecc8e]
    - @wirecore/wirelayer-recipes@0.6.0
    - @wirecore/wirelayer-tokens@0.4.0

## 0.3.1

### Patch Changes

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

- Updated dependencies [056ef12]
    - @wirecore/wirelayer-recipes@0.5.0

## 0.3.0

### Minor Changes

- 9fbee02: The packages ship `llms.txt` (overview with links) and `llms-full.txt` (every component with props, examples as
  Storybook links, the functions and the guides) for AI assistants, written by the build from the same data as the MCP
  server and matching the installed version – in each package's own syntax: Vue with `v-model`, events and slots, React
  with props and render props, React Native, and for `@wirecore/wirelayer-css` a reference of all `.wc-*` classes with
  parts, modifiers and defaults. Point an assistant at `node_modules/@wirecore/wirelayer-vue/llms.txt`.

### Patch Changes

- Updated dependencies [9fbee02]
    - @wirecore/wirelayer-recipes@0.4.1

## 0.2.2

### Patch Changes

- Updated dependencies [b46176b]
- Updated dependencies [b46176b]
- Updated dependencies [b46176b]
- Updated dependencies [b46176b]
- Updated dependencies [b46176b]
- Updated dependencies [b46176b]
- Updated dependencies [b46176b]
    - @wirecore/wirelayer-recipes@0.4.0
    - @wirecore/wirelayer-tokens@0.3.0

## 0.2.1

### Patch Changes

- Updated dependencies [5e0740a]
    - @wirecore/wirelayer-recipes@0.3.0

## 0.2.0

### Minor Changes

- 54609a3: DataTable: new prop `csvSeparator` for the CSV export, also for the built-in export button. By default the separator
  now follows the locale like a spreadsheet does (`csvSeparator(locale)` from the recipes): `;` where numbers have a
  decimal comma (de-DE, fr-FR …), `,` otherwise (en-US …). Before, it was always `;`. `exportCsv({ separator })` still
  wins over both.
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

- 54609a3: Documentation says English is the default language, as it is in the code: `useLocale` and the MCP server/`llms.txt`
  no longer claim German without a `LocaleProvider`.
- f396bd4: DataView: in the browser (react-native-web) the scrolling list takes the keyboard focus, so the arrow keys scroll it even
  when the items have no controls.
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

- Updated dependencies [3226614]
    - @wirecore/wirelayer-tokens@0.1.0
    - @wirecore/wirelayer-recipes@0.1.0
