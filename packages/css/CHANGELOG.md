# @wirecore/wirelayer-css

## 0.15.0

### Minor Changes

- 1ee83b2: Banner for permanent, page-wide notices ("TEST SYSTEM", maintenance): `solid` fills it opaquely in the colour of the
  variant with the matching text colour (info → `bg-info text-on-info`, …, neutral → `bg-fg text-bg`); `position="sticky"`
  keeps it in the flow and at the top edge while the page scrolls (opaque also without `solid`, below dialogs and
  drawers). React Native gets `solid` (no `sticky`). Stories _Solid_ and _Sticky_.

## 0.14.0

### Minor Changes

- 092ac0e: Countdown: `format="clock"` shows the time as a clock – "05:12:33" instead of "05 Hrs 12 Min 33 Sec". The units stay
  for screen readers (`sr-only`; on iOS and Android the timer reads its value text as before), the colons are hidden from
  them. With `variant="boxed"` one box surrounds the whole clock. New recipe variant `format` and slot `separator`; story
  _Clock_ in every Storybook.
- 693adb4: DataTable: `footerPosition="top"` shows the totals row (`aggregate`, `footer`, own footer cells) right below the
  headers instead of below the rows – with `scrollHeight` it stays in view with the sticky headers. The line separates it
  from the rows below (recipe variant `footerTop`). Story _Totals on top_.
- c10e906: DataTable: the column option `headerHint` explains a column – an (i) button next to the header shows the text
  (Toggletip, outside the sort button), and screen readers get it as the description of the column header. The button is
  no taller than the header text (recipe slots `headHint` and `headHintIcon`), so the header row keeps its height. Story
  _Header hint_.
- 1c190d0: TagsInput: every suggestion without typing. `openOnFocus` opens the suggestions when the field gets the focus or is
  clicked; `trigger` adds a button with an arrow at the end of the field that opens and closes them ("Show suggestions",
  not a tab stop – Arrow down does the same, the focus stays in the field). New recipe slots `trigger` and
  `triggerIcon`; story _All suggestions_.

### Patch Changes

- a348907: Sortable: a drag with the mouse no longer gets stuck. The handle listened for the pointer itself; once the dragged item
  moved in the DOM (to another place, above all into another list) the browser ended the pointer capture, the release
  landed elsewhere and the item stayed picked up (`data-grabbed`). The controller now follows the press on the document
  until it ends.

    - Near the edge of a scrolling area (or the window) a drag scrolls it – the innermost area that can still scroll that
      way, then the ones around it.
    - A copy of the item follows the pointer while it is dragged (recipe slot `preview`, `aria-hidden` and inert), also on
      the way out of a source list (`clone`), where nothing showed until the pointer was over a target.
    - New story _Scrolling_; browser tests for drags across several places, into another list and near the edge.

## 0.13.0

### Minor Changes

- 4672886: DataTable `searchAlign="center"` (recipe variant `searchCentered`) puts the search in the middle of the toolbar. It used
  to centre the field in the free room between the start and the end group – without controls at the start and with a
  wide end group (refresh, print, filters, columns) it sat clearly left of the middle.

    - The start group (also when empty) and the end group share the room on both sides equally, so the search is centred
      in the toolbar however wide the tools at the end are. A group wider than its half moves the search aside instead of
      overflowing; when they do not fit next to it the toolbar wraps.
    - Narrow toolbars (container query, below 42rem): the search starts the row, wrapped onto a row of its own it is
      centred, the tools follow at the end.
    - With `searchAlign="center"` own `toolbar` controls join the end group (before the built-in buttons) and own
      `toolbarStart` controls form one group – `searchAlign="start"` renders the toolbar as before.
    - Story “Search in the middle, nothing at the start”.

- c565b54: DatePicker and DateRangePicker with `withTime`: the time can be set below the calendar as well. Until now only the
  field had hour and minute – the calendar popup picked the day, so changing the time needed typing.

    - Below the calendar one time field (hour and minute, typed or with the arrow keys, in the locale's 12 or 24 hours) –
      in a DateRangePicker two, “Start” and “End”, in a group named “Time”; with `showTimeZone` the zone after them. On the
      day of `min`/`max` the time is limited to it.
    - Picking a day keeps the calendar open; “Done” closes it, Escape discards what changed since it opened.
    - `timeInPopup={false}` (Vue `:time-in-popup="false"`) keeps the time in the field only, the calendar closes on a day as
      before.
    - The DataTable features `dateInput` and `dateRangeInput` get it for `datetime` columns (filters and editors).
    - New texts `calendar.time` and `calendar.done` in every language; new recipe parts `timeSection`, `timeHeading`,
      `timeField`, `timeFieldLabel` and `timeDone`.

- 246c257: Slim scrollbars: `data-scrollbars="slim"` – on `<html>` for the whole page, or on any element for that part – draws
  the scrollbars as a narrow, rounded stroke. `thin` is drawn by the browser, and in Chrome and Edge (above all on
  Windows) it stays a system-like bar, depending on the version with arrow buttons and a square thumb; a stroke is only
  possible through `::-webkit-scrollbar`, which Chromium ignores while `scrollbar-width` or `scrollbar-color` is set.

    - Browsers with `::-webkit-scrollbar` (Chromium, Safari): the stroke is `--wc-scrollbar-size` wide (new variable, 6px),
      2px off the edge, no arrow buttons, the track and the corner transparent; under the pointer and while dragging the
      thumb takes the full 10px and `--wc-scrollbar-thumb-hover`. Colours from `--wc-scrollbar-thumb` (`line-strong`, at
      least 3:1 against the surfaces), so light, dark and parts with their own `data-mode` follow.
    - Firefox keeps `thin` in the theme colours; forced colors keep the system scrollbars. The default (`thin`) and
      `data-scrollbars="native"` do not change.
    - Docs: _Theming › Themes › Scrollbars › Slim scrollbars_ with a list and a table in light and dark.

### Patch Changes

- c565b54: DateRangePicker with `withTime`: two fixes.

    - A new range picked in the calendar keeps the end time. The calendar starts a new range with the start alone, so the
      end took the time of the start (04.09. 17:00 – 06.09. 16:00 became 14.09. 17:00 – 16.09. 17:00). Each side now keeps
      its last time; without one the start gets 00:00 and the end 23:59.
    - In a narrow field (a form column, the filter row of a DataTable) the value no longer runs under the clear button: the
      date input is clipped, and a focused part scrolls into view.

- 1b223d3: Dialog: a long dialog is no longer cut off at the top. With the default `scrollBehavior="outside"` the positioner
  centred the dialog with `items-center`, which splits the overflow of a dialog taller than the window above and below –
  the part above (title, close button) lay outside the scrolling area and could not be reached, only the end could. The
  positioner now centres safely (`items-center-safe`, `items-end-safe` for `position="bottom"`): short dialogs stay in the
  middle, a taller one starts at the top (with the `p-4` margin) and scrolls down to its buttons. Applies to Dialog and
  everything built on it (AlertDialog, `confirm()`, `prompt()`, `openDialog()`).

    - React Native: with `outside` the whole dialog (header, body, footer) now scrolls and is never taller than the screen;
      before, a long dialog ran off the screen at the top and the bottom.
    - `scrollBehavior="inside"` keeps the header and footer of long forms in view – app-wide with
      `dialog: { defaultVariants: { scrollBehavior: 'inside' } }`. Stories “Long content”.

- f96d07d: Checkbox, Radio, Switch and the other controls with a hidden native input no longer stretch the page or make a dialog
  jump. Ark's hidden input is absolutely positioned (1px, visually hidden), and the part around it was not positioned, so
  the input was placed against the page: a scrolling area (DataTable with `scrollHeight`, the body of a Dialog with
  `scrollBehavior="inside"`) did not clip it. A DataTable with `selectable` left an invisible point per rendered row below
  its scroll area – the page got a long empty end and, with `virtual`, grew while the rows scrolled; in a dialog, focusing
  a checkbox further down scrolled the positioner instead of the body, so header and close button left the screen.

    - `relative` on the part around the hidden input: `checkbox` base, `radioGroup` item, `switchControl` base,
      `segmentedControl` item, the base of `select`, `multiSelect`, `pinInput`, `colorPicker` and `fileUpload`
      (`selectionCard` and `colorSwatchPicker` had it already).
    - `relative` on the scroll area of the DataTable, so absolutely positioned content of own cells stays inside as well.

## 0.12.0

### Minor Changes

- 1e42647: DataTable: defaults for the whole app instead of on every table – all through the `defaultVariants` of the `dataTable`
  recipe (RecipesProvider/ConfigProvider `recipes`), the prop on a single table still wins:

    - `showFilters` (new classless variant): `{ showFilters: false }` starts every table with `filterToggle` with closed
      filters; the prop and a saved state (`stateKey`) win as before.
    - `striped`, `gridlines`, `bordered`, `wrapHeaders`, `verticalHeaders`: the Vue DataTable passed `false` for an unset
      prop to the recipe, so their `defaultVariants` never applied (React: `gridlines`, `bordered`, `striped`,
      `wrapHeaders`, `verticalHeaders` likewise) – unset props now take them.
    - Own controls in the toolbar slots (`#toolbar`, `#toolbarStart`, `#toolbarEnd` / `toolbar`, `toolbarStart`,
      `toolbarEnd`) default to the size of the built-in ones (`sm`): Button, IconButton, Input, Select, menu triggers …
      match the search and the filter, columns and density buttons; an explicit `size` wins.
    - A text filter (filter row and filter menu) shows the placeholder “Filter …” (new translation `dataTable.filterText`,
      in every bundled language); `filterInputProps.placeholder` replaces it.

    Docs: _Customizing_ lists the DataTable defaults.

- db0d280: DataTable: `scrollHeight="fill"` – the table takes the rest of a flex column instead of a fixed height. A table that
  should reach down to the bottom of the page under a heading and figures needed an estimated `calc(100dvh - 12rem)`, too
  big or too small depending on what is above it and on the window width. With `fill` the table is a flex item
  (`flex-1 min-h-0`), its scroll area takes the room left between toolbar and footer (new recipe variant `fill`, with
  `contain: size` so the rows do not stretch the page), and the new prop `minScrollHeight` (e.g. `60vh`) keeps it from
  collapsing – below that the page scrolls. Toolbar, header and footer stay visible; virtual scrolling measures the area.
  Story “Fill the rest”, docs with a page layout; the PrimeVue migration guide maps `scrollHeight="flex"` to it.
- a075bb3: DataTable: new prop `searchAlign` (`start` – default, as before – or `center`). With `center` the search field sits in the
  middle between your own controls at the start of the toolbar and the controls at the end, with the same room on both
  sides; without controls at the start it is centred in the free room, the end group stays at the end, and on narrow
  screens the toolbar wraps as before. The recipe variant `searchCentered` sets it for the whole app:
  `{ dataTable: { defaultVariants: { searchCentered: true } } }` (only tables with `search` change). Story “Search in the
  middle”.
- 34d5a83: DataTable: new prop `sortable` for the whole table – every column with a value can be sorted unless it sets
  `sortable: false`; columns without a value of their own (no field in the rows, no `accessor` or `sortFn`, e.g. a column
  of action buttons) stay out. As a classless variant of the `dataTable` recipe it can be set for the whole app:
  `{ dataTable: { defaultVariants: { sortable: true } } }`, the prop on a table and `sortable` on a column win.
- 9fd6d37: Drawer and Dialog: own content in the header row – slot `#header` (Vue), prop `header` (React, React Native), e.g. the
  logo of the app next to the close button of a navigation drawer.

    - The content sits where title and description are, before the close button (Dialog: after the icon, before the
      maximize and close buttons), takes the free space and is centred with the close button (new recipe part
      `headerContent`, Drawer variant `customHeader`).
    - The title stays required and keeps naming the panel (`aria-labelledby`); with header content it is shown for screen
      readers only by default. `hideTitle: false` shows it next to the content (Drawer) or where `titlePosition` puts it
      (Dialog). The description stays connected (`aria-describedby`).
    - React Native Drawer (side panel and sheet): `header` and `hideTitle`; a hidden title names the panel via `aria-label`.
    - Without header content nothing changes.

- 5cec045: Scrollbars in the WireLayer look. Only `ScrollPanel` had designed scrollbars; the page itself, DataTable with
  `scrollHeight`, long dialogs and drawers, Select and Menu lists or a Textarea showed the browser's – wide, and light in
  dark mode. Now every scrolling area gets thin scrollbars like ScrollPanel: the thumb in `line-strong` (3:1 against the
  surfaces in every theme and mode), the track transparent, following the mode and theme of its part of the page.

    - Safari (no `scrollbar-color`) gets the same look through `::-webkit-scrollbar`, with `muted` under the pointer;
      forced colors keep the system scrollbars.
    - Change them with `--wc-scrollbar-thumb`, `--wc-scrollbar-thumb-hover`, `--wc-scrollbar-track` and
      `--wc-scrollbar-width`; `<html data-scrollbars="native">` keeps the browser's own.
    - Base layer: utilities such as `[scrollbar-width:none]` still win. Docs: _Theming › Themes › Scrollbars_.

### Patch Changes

- dfc2bf5: DataTable `resizable`: the resize handle of the last column no longer sticks out of the table. Every handle lies half
  over the border to the next column; the last one has none, so it reached 4px past the table – a table whose columns fit
  exactly scrolled a little sideways, and its line stood after the last column (next to the scrollbar with
  `scrollHeight`). The handle of the column that ends the table (also after hiding, reordering or pinning columns; not when
  the action column follows) now lies inside it, without the line at rest (new variant `edge` of the `resizer` part);
  mouse, touch and keyboard still resize it.
- 876b523: DataTable `striped` with `virtual`: the pattern no longer jumps while scrolling. The tint came from the position in the
  DOM (`even:`), but virtual scrolling renders a spacer row and only a window of the rows, so the tinted rows changed with
  the scroll position. Every data row now carries `data-stripe="true|false"` by its place among the data rows of the page:
  group and detail rows do not count (the pattern runs on across the groups), frozen rows alternate among themselves.
  Rows without the attribute – plain HTML with `@wirecore/wirelayer-css` – still follow their position. Hover and the
  selected state win over the tint as before.
- efcb41e: `data-mode` and `data-theme` on a part of the page now set the text colour of that part as well. Body computes the text
  colour once from the page's mode and passes it down as a fixed value, so in a `data-mode="light"` part of a dark page
  text that inherits its colour (e.g. in a Card or a table) stayed light – light text on a white card – and the other way
  round. The rule sits in the base layer (`color: var(--wc-fg)`), so `text-*` classes still win; the part gets no
  background and may stay transparent. Overlays (Dialog, Drawer, Popover, Menu) already set their text colour and need no
  change; React Native switches mode and theme for the whole app.

## 0.11.0

### Minor Changes

- fd1574d: Corners that stayed rounded in a square theme now follow a variable; without a theme everything looks as before:

    - New theme variable `--radius-dialog` (14px, `rounded-dialog`): Dialog, ConfirmDialog, CommandPalette and the
      fullscreen view of Gallery and Image – also in React Native.
    - New `--wc-dialog-icon-radius` (10px): the icon box in the header of a Dialog (web and React Native).
    - New `--wc-avatar-radius`: Avatar with `shape="square"`, one value for all sizes (defaults by size as before, web and
      React Native).
    - New `--wc-checkbox-radius` (5px, 4px in lists): Checkbox, SelectionCard `type="checkbox"` (web and React Native) and
      the check boxes in Listbox, MultiSelect and Tree.
    - `--wc-control-radius-sm`/`-md`/`-lg` now also apply to TreeSelect, CascadeSelect, the TimeGrid slots and (`-lg`) the
      drop outline of OrderList and PickList.
    - React Native reads `--wc-control-radius-sm`/`-md`/`-lg` as well: Input, Textarea, Select, DurationInput, TagsInput and
      the TimeGrid slots (`-md` in every size, as before 8px).

    _Theming › Themes › Square corners_ lists every variable a theme sets to 0 for square corners.

## 0.10.0

### Minor Changes

- d1fec76: Affix: `offsetX` (side edge, start/end) and `offsetY` (top or bottom edge) set one distance each, e.g. higher above a
  banner; `offset` stays the distance from both edges and the default of the two. In HTML: `--wc-affix-offset-x` and
  `--wc-affix-offset-y`.
- a9fa66f: NotificationCenter:

    - Items without `href` can be `clickable`: their title becomes a button that reports `select` / `onSelect` (opt-in per
      item; items without both stay text). In React the event of `onSelect` is a `MouseEvent<HTMLAnchorElement |
HTMLButtonElement>` now.
    - `markAllRead` / `onMarkAllRead` gets the ids of the unread items shown (Vue, React and React Native), e.g. for one
      request to the server instead of one per item.

- b9d33fb: Themes can set a second brand color: the optional tokens `accent` and `on-accent` become the Tailwind colors
  `bg-accent`, `text-accent`, `border-accent` and `text-on-accent` (also in React Native via `native.css`). Without them
  they follow `primary` and `on-primary`, so existing themes stay as they are. `checkTheme` and `suggestThemeFixes` check
  text on the accent and the accent as text on `bg`, `bg-2` and `card` once a theme sets `accent` or `on-accent` in a
  mode. `resolveTokens()` returns them as well. No component uses the accent.
- b9d33fb: Themes can set the hover of the primary color: the optional token `primary-hover` is the fill of solid primary buttons
  and the text of tinted ones (`soft`, `outline`, `text` in the primary color, Button and IconButton, and avatar buttons
  with `color="primary"`) on hover – for strong brand colors whose faded hover or tinted text misses 4.5:1. `checkTheme`
  checks the hover pairs with it, and `suggestThemeFixes` suggests one `primary-hover` for all of them before it changes
  `primary`.

    Changed behavior:

    - Without `primary-hover`, solid primary buttons now fade only their fill on hover (to 85 % via `color-mix`), no longer
      the whole button with `opacity` – the text stays opaque. The bundled themes look the same, the contrast is never
      lower. The other solid colors keep fading with `opacity`.
    - `checkTheme` additionally checks tinted primary text at rest (`soft primary: text-primary on bg-primary/10` on `bg`,
      `bg-2`, `card`, and `avatar primary: text-primary on primary/14 (card)`), which the hover pairs no longer imply. A
      custom theme that missed a tinted primary hover may be reported for these pairs too.

## 0.9.1

### Patch Changes

- ad4939e: READMEs and the guide "Getting started": installation with npm, pnpm, Yarn and Bun (React Native: also
  `npx expo install`).

## 0.9.0

### Minor Changes

- 849eac6: Display parts for dense desktop UIs, all opt-in:

    - `Progress status="neutral"`: a grey fill, e.g. for a cancelled transfer (also React Native)
    - `Avatar initials`: own initials instead of the ones from `name` ("MS" for "my-server"; also React Native)
    - `Card size="sm"`: smaller radius, padding and title, for lists of cards inside a dialog (`wc-card-sm` in HTML);
      `ConfigProvider size` leaves cards alone
    - `Code` in the main package: code in a sentence with the look of `InlineCode`, without syntax colours and without the
      optional `shiki`

    `rounded-card` and `rounded-panel` now count as radii for tailwind-merge (like `rounded-popup`): another radius in
    `class`/`classes` replaces them instead of both classes ending up on the element.

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
