# @wirecore/wirelayer-recipes

## 0.7.0

### Minor Changes

- ed18228: `Alert` takes actions – Vue slot `#actions`, React and React Native prop `actions` – e.g. "Workspace locked –
  [Unlock]": beside the text, below it when there is little room (React Native: below the text). Recipe slots `text` and
  `actions`, variant `hasActions`; without actions the DOM stays as it was.
- ed18228: `DialogContent` (React Native: `Dialog`) takes `titlePosition: 'body' | 'header'` (default `body`, as before). With
  `header` the title sits in the row of the close and maximize buttons, after a smaller icon, the header separated by a
  line – as on the Drawer; a long title wraps. Recipe variant `titleInHeader` for `dialog` (HTML: `wc-dialog-title-in-header`).
- ed18228: Menus for desktop apps, all opt-in:

    - `ContextMenu` reports its open state (Vue `v-model:open` / `update:open`, React `open`/`onOpenChange`) – e.g. to keep
      Delete, Enter or F2 from the list below while it is open – and `before-open` / `onBeforeOpen` with the right-clicked
      (or long-pressed) element, to select its row before the menu shows
    - `Menu` and `ContextMenu` take `closeOnScroll`, `closeOnResize` and `closeOnBlur` (default `false`): a menu at a point
      closes when the content below scrolls (not a scroll inside the menu), the window is resized or loses the focus
    - `highlightFirst` on both: the first item is highlighted also when the menu opens by pointer, so Enter takes it
    - `closeMenuOnPageEvents` in the recipes

- ed18228: `mono` on `Input`, `PasswordInput` and `Textarea` (default `false`): the theme's monospace font (JetBrains Mono) for
  paths, tokens, recovery codes, URLs and keys. Recipe variant `mono` for `input`, `passwordInput` and `textarea`.
- ed18228: Compact `Progress` for lists and status bars, all opt-in:

    - `size: 'xs' | 'md'` – `xs` is a thin bar with small text
    - `status: 'info' | 'success' | 'warn' | 'danger'` colours the fill
    - `hideLabel`: the label only names the bar for screen readers
    - `barText`, e.g. "42 %", "waiting" or "failed": text in a taller bar (horizontal, without segments or steps), readable
      over the empty and the filled part; screen readers get it after the value

## 0.6.0

### Minor Changes

- e7ecc8e: Component variables for the measures a brand usually changes – set them on `:root`, a `[data-theme]` or any element.
  Their defaults are the values the recipes had, nothing looks different without them:

    - `--wc-control-h-sm` / `-md` / `-lg` (2rem / 2.5rem / 3rem): height of buttons, icon buttons and fields per size
    - `--wc-control-radius-sm` / `-md` / `-lg` (6px / 8px / 10px) and `--wc-control-text-sm` / `-md` / `-lg` (13px / 15px /
      16px): corners and text of the fields (Input, Textarea, NativeSelect, Select, MultiSelect, Combobox, NumberInput,
      PasswordInput, the date and time fields, ColorPicker, TagsInput)
    - `--wc-button-radius` (8px): Button and IconButton with `shape="rounded"`
    - `--wc-card-p` (1.5rem): padding of Card
    - `--wc-backdrop` (`rgb(0 0 0 / 0.6)`): dimming behind Dialog, Drawer and ConfirmDialog

    The recipes use the variables instead of fixed classes (`h-10` is now `h-[var(--wc-control-h-md,2.5rem)]`) – selectors
    on the old class names (`[&.h-10]:…`) no longer match; use `variants` in `RecipesProvider` instead.

    Fix: `--radius-card`, `--radius-panel` and `--radius-popup` were compiled into the utilities (`@theme inline`), so a
    theme could not change them at runtime. The utilities now read the variables; the values stay the same.

- e7ecc8e: `DialogContent` and `DrawerContent` take `hideTitle` (Vue `hide-title`), like `PopoverContent`: the title stays the
  accessible name of the dialog but is shown for screen readers only – e.g. around a video. Recipe variant `hideTitle` for
  `dialog` and `drawer`.
- e7ecc8e: An own `id` on Ark-based controls no longer breaks them. Ark finds its parts by the ids it generates – an `id` passed to
  a Select ended up on the trigger and replaced that id, so the list opened at the top left of the page; the focus did not
  return after choosing. The `id` now goes through Ark's `ids` to the part a `<label for>` points to, the ids of a
  surrounding Field are kept:

    - the trigger: Select, MultiSelect, VirtualSelect, CascadeSelect, TreeSelect, ColorPicker (the buttons of the last three
      are named by the label and describe themselves by their value)
    - the input: Combobox, Autocomplete, NumberInput, PasswordInput, TagsInput, QuarterPicker (React; Vue already did),
      ColorInput and Mentions (Vue lost it outside a Field)
    - the hidden check box: Checkbox, Switch, CheckboxCard – a Switch without text leaves out its empty label, which hid a
      `<label for>`

    No label element can name a date field (spin buttons per part), a slider, a list box or a group: DatePicker,
    DateRangePicker, MonthPicker, YearPicker, TimePicker, TimeRangePicker (the first date or time gets the id),
    DurationInput (its group), Knob (the dial), Rating, PinInput, Listbox, AngleSlider (their root) keep the id, and a
    `<label for>` pointing at one of them – or at a Slider, RadioGroup or SegmentedControl – warns in development: use a
    Field or `aria-label`. New in `@wirecore/wirelayer-recipes`: `controlIds()` and `warnLabelFor()`.

- e7ecc8e: Smaller additions, the defaults stay:

    - Slider `hideLabel`: the label is for screen readers only – it still names the thumbs; without `showValue` the header
      takes no room (also in React Native, where the thumbs keep the label as their name)
    - Carousel `controlsPosition: 'bottom' | 'sides'` (default `bottom`): with `sides` previous and next sit beside the
      slides, vertically centred; autoplay and dots stay below
    - Tooltip `closeOnScroll` (default `true`, as before): `false` keeps it open while the page or a container around the
      trigger scrolls

- e7ecc8e: Classes from `RecipesProvider` or `classes` no longer hide states. A provider with `input: { classes: { base:
'border-line-2' } }` replaced the red border of an invalid field (tailwind-merge let the later class win). The classes
  of an active state variant – `invalid`, `success`, `disabled`, `readOnly`, `current`, `selected`, `checked`, `loading`,
  also in compound variants – now come after the override classes of their part. The class passed to the component itself
  (`class`/`className`) still comes last and wins over everything. Without overrides nothing changes.
- e7ecc8e: DataTable `bordered`: a border around the whole table, with or without `gridlines` (which keep drawing the lines between
  the columns only). Recipe variant `bordered` of `dataTable`.
- e7ecc8e: DataTable pagination: `paginatorEdges` (Vue `paginator-edges`) adds the buttons to the first and the last page,
  `paginatorAlign` (`'between'` – the default, rows per page at the start and the pages at the end – `'start'`,
  `'center'`, `'end'`) places the pagination row. Recipe variant `paginatorAlign` of `dataTable`. The standalone
  `Pagination` has `withEdges` already.
- e7ecc8e: Select, MultiSelect, VirtualSelect, Combobox and Listbox warn in development when a chosen value is not among their
  items – it shows as raw text, e.g. `'DE'` with items that carry country names. They warn once the items are there: not
  while loading, not without items, not with a data source (it resolves values later) and not for free text
  (`allowCustomValue`). Nothing changes at runtime. New in `@wirecore/wirelayer-recipes`: `checkListValues()`; options
  of such values carry `unknown: true`.
- e7ecc8e: Recipe overrides per variant: `RecipesProvider` (and `useRecipe`) take `variants` – classes per part for single values
  of a variant, e.g. `button: { variants: { size: { md: { base: 'h-[2.625rem]' } } } }` – and `compoundVariants` for
  combinations (`{ size: ['sm', 'md'], shape: 'rounded', classes: { base: 'rounded-md' } }`). Names of variants, values and
  parts are typed from the recipe like `defaultVariants`. Inner providers extend outer ones. Order per part: `classes`,
  matching `variants` and `compoundVariants`, the states of the recipe, overrides of states, the own `class`. New types
  `RecipeVariantClasses`, `RecipeCompoundClasses`, `RecipeVariantName`.
- e7ecc8e: Smaller CSS without listing files by hand: the Vite plugin `wirelayer()` from `@wirecore/wirelayer-recipes/vite` reads
  the imports from `@wirecore/wirelayer-*` in an app's source files (Vue, React, Astro, MDX …) and adds the sources files
  of the imported components and recipes to the CSS file that imports `theme.css` or `styles-core.css` – in development
  again when an import is added. Put it before Tailwind's plugin; works with Nuxt and Astro (`vite.plugins`). `vite` is an
  optional peer dependency.

    New `@wirecore/wirelayer-vue/theme.css` and `@wirecore/wirelayer-react/theme.css`: the theme without fonts and without
    component classes, for an app with its own font (`@theme { --font-sans: … }`) – the WireLayer fonts are no longer
    bundled. `fonts.css` brings them separately. `styles.css` and `styles-core.css` stay unchanged.

## 0.5.0

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

## 0.4.1

### Patch Changes

- 9fbee02: Avatar `as="button"` hovers like the IconButton with the same look, so triggers side by side in a bar (app switcher,
  user menu) behave alike: `outline` darkens its border, `soft` its background (like `secondary`), `solid` fades like the
  filled variants, a `color` tint gets stronger (14 % → 18 %). The ring on hover and while the menu is open is gone –
  only an avatar showing an image without a border (soft, solid) keeps a ring on hover, where the background change
  would be hidden. New TopBar story with both triggers.

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

## 0.3.1

### Patch Changes

- 9c4aa96: Fix: the sources files of `styles-core.css` brought the classes of all recipes with automatic source detection
  (`@import 'tailwindcss'`) – Tailwind scans the whole folder of a file that an `@source` in `node_modules` points to,
  and the class lists of all recipes were files in one folder. `sources/<recipe>.css` now contains the classes as
  `@source inline()`; the imports stay the same. Tailwind CSS 4.1 or newer is required (`@source inline()`, and
  `@source not`, which `styles.css` already used): the peer dependency is now `^4.1.0`.

## 0.3.0

### Minor Changes

- 5e0740a: Smaller CSS for apps that use only a few components (opt-in, `styles.css` is unchanged): `styles-core.css` brings the
  theme and the fonts without the classes of the components, which an app then imports per component it uses –
  `@wirecore/wirelayer-vue/sources/Button.css`, `@wirecore/wirelayer-blocks-vue/sources/SiteHeader.css` (also the
  React packages) – or per recipe it calls itself: `@wirecore/wirelayer-recipes/sources/card.css`. The file of a component
  brings the classes of the components it renders as well. A site with a header, buttons, cards and prose shrinks from
  about 184 kB (29 kB gzip) to 47 kB (10 kB gzip). In development the components warn when the classes of a recipe they
  render are missing (`checkRecipeSources` in the recipes).

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

### Patch Changes

- 54609a3: Documentation says English is the default language, as it is in the code: `useLocale` and the MCP server/`llms.txt`
  no longer claim German without a `LocaleProvider`.

## 0.1.1

### Patch Changes

- 1cbdeda: Every package has a README on npm now (installation, usage, links to Storybook and GitHub).

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
