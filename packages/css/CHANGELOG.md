# @wirecore/wirelayer-css

## 0.8.0

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

## 0.7.0

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

## 0.6.0

### Minor Changes

- 18a647e: `wirelayer-css embed`: WireLayer inside a page that brings its own CSS (WordPress admin, a host app) – the chosen components in one file, scoped to one element (`--scope '#my-app'`), without `@layer`, with the fonts. The parts come precompiled in `dist/embed/`, no build tools needed. `wirecore.css` and `components.css` stay unchanged.
- 2431cd9: Checkbox without JavaScript: a native `<input type="checkbox" class="wc-checkbox-input">` right before `.wc-checkbox-control` sets checked, focus, invalid (`aria-invalid`) and disabled – new rules in `wirecore.css` and `components.css`, nothing existing changes.

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

## 0.4.0

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

## 0.3.0

### Minor Changes

- b46176b: Avatar `as="button"`: the avatar as a button, e.g. the trigger of a user menu (`<Menu><Avatar as="button" name="…" />
  </Menu>`), with the focus ring of the other buttons and a ring on hover and while its menu is open (avatar recipe:
  variant `interactive` and slot `content`, `.wc-avatar-interactive`). The button is named by an image inside it that
  carries `name`, so the visible initials do not have to be part of an aria-label (WCAG 2.5.3 label in name). An explicit
  `aria-label` on an avatar that is not a button now wins over `name`.
- b46176b: One corner radius for all floating surfaces: the new token `--radius-popup` (12px, class `rounded-popup`) is used by
  Menu, ContextMenu, Menubar menus, the option lists of Select, MultiSelect, Combobox, Autocomplete, TagsInput, Mentions,
  CascadeSelect and TreeSelect, Popover, HoverCard, ConfirmPopup, Tour, DatePicker, ColorPicker, the DataTable filter
  panel, NavigationMenu, MegaMenu, FloatingPanel and the editor's bubble menu and mention list. Visible change: menus and
  option lists go from 10px to 12px (their items from 6px to 8px, so the corners stay concentric), the editor's menus
  from 8px to 12px; the panels already had 12px. Tooltip, Toast and Dialog keep their radius. A theme can set
  `--radius-popup` to change all of them at once.
- b46176b: New TopBar: a slim app header outside AppShell (`<header>`) with `start`, the middle (default slot / children, takes
  the free space) and `end` – without menus and without the toolbar's arrow-key navigation (recipe `topBar`,
  `.wc-top-bar`).

## 0.2.0

### Minor Changes

- 1ccb5ce: **Behavior change:** without `data-mode` the page now follows the system setting (`prefers-color-scheme`) instead
  of always being light. `data-mode="light"` or `data-mode="dark"` forces a mode as before, also for a part of the page
  (a forced light part stays light on a dark system).

    - The `dark:` variant follows the same rules, and so do the dark colors of the built-in themes and of custom themes
      generated with `themeToCss`.
    - Charts (Chart, ChartCanvas, Sparkline) recolor when the system setting changes.
    - Apps that relied on "no attribute = light" and want to keep it: set `data-mode="light"` on `<html>`. Apps that set
      `data-mode` from `prefers-color-scheme` with JavaScript can drop that.

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
