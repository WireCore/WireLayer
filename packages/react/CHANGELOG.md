# @wirecore/wirelayer-react

## 0.14.0

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

### Patch Changes

- c565b54: DateRangePicker with `withTime`: two fixes.

    - A new range picked in the calendar keeps the end time. The calendar starts a new range with the start alone, so the
      end took the time of the start (04.09. 17:00 – 06.09. 16:00 became 14.09. 17:00 – 16.09. 17:00). Each side now keeps
      its last time; without one the start gets 00:00 and the end 23:59.
    - In a narrow field (a form column, the filter row of a DataTable) the value no longer runs under the clear button: the
      date input is clipped, and a focused part scrolls into view.

- Updated dependencies [4672886]
- Updated dependencies [c565b54]
- Updated dependencies [c565b54]
- Updated dependencies [1b223d3]
- Updated dependencies [f96d07d]
- Updated dependencies [246c257]
    - @wirecore/wirelayer-recipes@0.13.0
    - @wirecore/wirelayer-tokens@0.9.0

## 0.13.0

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

- 19a30f6: DataTable: new feature `dateRangeInput` – a `between` filter of a `date` or `datetime` column shows one DateRangePicker
  for both ends instead of two fields below each other, in the filter row and in the filter menu. The filter value stays
  `[from, to]` (the picker's `{ start, end }` is converted both ways), so `filters`, saved states and server requests do
  not change. Without the feature it stays two fields. Use it like the other input features:
  `:features="[dateInput, dateRangeInput]"`.
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
- 5ea0d05: Dialog: the title position can be set once for the whole app. `DialogContent` reads `titleInHeader` from the
  `defaultVariants` of the `dialog` recipe (RecipesProvider/ConfigProvider `recipes`) when `titlePosition` is not set –
  `{ dialog: { defaultVariants: { titleInHeader: true } } }` puts the title of every dialog next to the close button; the
  prop on a single dialog still wins.

    - `ConfirmDialog` (`confirm()`, `prompt()`) and `DialogHost` (`openDialog()`) follow the same default; their requests
      take the new option `titlePosition`, which wins over it. Before, the default only changed their classes, not where the
      title is.
    - New `useRecipeDefaults(name, recipe)`: the default variants of a recipe with those of the nearest RecipesProvider –
      for own components whose markup depends on a variant.
    - Docs: _Customizing_ lists the recipe defaults that change more than classes; the PrimeVue migration guide shows the
      central setting. React Native has no RecipesProvider, the prop stays on the single dialog there.

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

- 1ff4096: NotificationCenter: the look of the bell is configurable – `variant` (IconButton variant, default `text` as before),
  `color` and `size`, for `display="popover"` and `"drawer"`. A bell in a header with outlined icon buttons (e.g.
  `ModeToggle variant="outline"`) can now match them: `<NotificationCenter variant="outline" size="sm" />`. React Native:
  the same props (without them the bell keeps the IconButton default).

### Patch Changes

- 19a30f6: DataTable: all fields of the filter row are equally high. Text, number and browser date fields were small (`sm`), the
  DatePicker (`dateInput` feature), Select and MultiSelect (“All”) had the medium height – now they are small as well,
  also in the filter menu and in row editing.
- dfc2bf5: DataTable `resizable`: the resize handle of the last column no longer sticks out of the table. Every handle lies half
  over the border to the next column; the last one has none, so it reached 4px past the table – a table whose columns fit
  exactly scrolled a little sideways, and its line stood after the last column (next to the scrollbar with
  `scrollHeight`). The handle of the column that ends the table (also after hiding, reordering or pinning columns; not when
  the action column follows) now lies inside it, without the line at rest (new variant `edge` of the `resizer` part);
  mouse, touch and keyboard still resize it.
- 0a10e31: DataTable: columns without their own `sortFn` sort texts and dates correctly. TanStack Table picks `text` or
  `alphanumeric` for text columns and `datetime` for `Date` values, but only `alphanumeric` was registered – in
  development the console said "sortFn 'text' (auto) … is not registered" and the column fell back to comparing character
  codes (upper and lower case apart, umlauts at the end).

    - All sort functions the automatic choice can pick are registered: `text`, `alphanumeric`, `textCaseSensitive`,
      `alphanumericCaseSensitive`, `datetime`, `basic`.
    - `text` and `alphanumeric` sort by the language of the table (LocaleProvider/ConfigProvider, `Intl.Collator` with
      numbers counted): case does not matter, “Ärger” comes after “Anna”, “Server 2” before “Server 10” – the same rules as
      the React Native DataTable.

- 876b523: DataTable `striped` with `virtual`: the pattern no longer jumps while scrolling. The tint came from the position in the
  DOM (`even:`), but virtual scrolling renders a spacer row and only a window of the rows, so the tinted rows changed with
  the scroll position. Every data row now carries `data-stripe="true|false"` by its place among the data rows of the page:
  group and detail rows do not count (the pattern runs on across the groups), frozen rows alternate among themselves.
  Rows without the attribute – plain HTML with `@wirecore/wirelayer-css` – still follow their position. Hover and the
  selected state win over the tint as before.
- Updated dependencies [1e42647]
- Updated dependencies [db0d280]
- Updated dependencies [dfc2bf5]
- Updated dependencies [a075bb3]
- Updated dependencies [34d5a83]
- Updated dependencies [876b523]
- Updated dependencies [9fd6d37]
- Updated dependencies [efcb41e]
- Updated dependencies [5cec045]
    - @wirecore/wirelayer-recipes@0.12.0
    - @wirecore/wirelayer-tokens@0.8.0

## 0.12.2

### Patch Changes

- Updated dependencies [fd1574d]
    - @wirecore/wirelayer-tokens@0.7.0
    - @wirecore/wirelayer-recipes@0.11.0

## 0.12.1

### Patch Changes

- 3375240: More components pass extra attributes on:

    - ScrollTop (its button, now also `style`), Sparkline and VirtualList take them on their outermost element in Vue and
      React.
    - React: a `onKeyDown` given to JsonViewer or a feed Timeline, or a `onKeyDownCapture` given to Tree or VirtualTree,
      runs as well instead of being replaced by the component's own (as in Vue).
    - React Native: Carousel, DataView, Listbox, MeterGroup, OrderList, OrgChart, PickList, PinInput, Rating,
      SignaturePad, Sortable, Stepper and VirtualList take the view props (`testID`, `nativeID`, accessibility props …)
      on their outermost view, like Panel or Timeline already did.

- 4742ccd: Extra attributes and listeners (`data-*`, `id`, `title`, `aria-describedby` …) now land on the outermost element of
  these components – before, Vue passed on only `class` and `style`, and the React props did not take them:
  AngleSlider, BarChart, BlockUi, Calendar, Carousel, CascadeSelect, Chart, ColorPicker, CompositeChart, CopyButton,
  DataView, Editor, Fieldset, Gallery, JsonViewer, Knob, LineChart, Listbox, LogViewer, MeterGroup, NavigationMenu,
  NotificationCenter (Vue), OrderList, OrgChart, Panel, PickList, PieChart, PinInput, ProgressCircle, Rating,
  ScrollPanel, SidebarNav, SignaturePad, Sortable, SpeedDial (its button), SplitButton, Splitter, Spoiler, Stepper,
  TableOfContents, Timeline, Toolbar, Tree, TreeSelect, VirtualTree and WaterfallChart. A `Tour` step or a test can
  target them by e.g. `data-tour` without a wrapper element.

    - `aria-label` still names what it labels, not the outer element: the list of Sortable and Listbox, the tree of Tree,
      VirtualTree and JsonViewer, the dial of Knob, the field of CascadeSelect, TreeSelect, ColorPicker, PinInput and
      Editor.
    - An `id` on a component built on an Ark root (e.g. Carousel, Stepper, Tree) becomes that root's id, so Ark keeps
      finding it. A control's own `id` prop is unchanged; Fieldset takes `id` as the base of its legend's and texts' ids.

## 0.12.0

### Minor Changes

- e423ca7: Tour:

    - `step` (Vue `v-model:step`, React/React Native `step` + `onStepChange`) shows the id of the current step and moves
      the tour there when set; `null` while it does not run.
    - `TourStep.before` runs before a step is shown (also for the first one and when going back) and may be async, e.g. to
      switch a tab; `TourStep.waitFor` waits up to that many ms for the target afterwards (it may still load). Meanwhile
      the previous step stays, busy (`aria-busy`, Back/Next disabled).
    - `missingTarget`: a step whose target is not there is skipped (default, in the direction the tour moves) or shown as a
      centred dialog (`'dialog'`). Before, the whole tour ended after 3 s without a word – `open` stayed `true`.
    - Steps passed after the tour was created (e.g. set right before opening it) are taken; `complete` is reported once.

    Sortable:

    - `clone` makes a list a source (e.g. a palette): its items are copied out – the function makes the copy, e.g. with a
      new id – it keeps them, takes none in and is not sorted. By keyboard (Space, arrows into a list, Space; Escape takes
      the copy back), pointer, two clicks and on React Native the screen reader action "Copy to “…”"; announced.
    - Nested lists (a list inside an item of another list of the group): the pointer over a nested list – also its empty
      area – puts the item there, not into the outer list; an item no longer goes into a list inside itself; a click in a
      nested list that does not take the item leaves the outer list alone.

### Patch Changes

- Updated dependencies [e423ca7]
    - @wirecore/wirelayer-recipes@0.10.0

## 0.11.0

### Minor Changes

- d1fec76: Affix: `offsetX` (side edge, start/end) and `offsetY` (top or bottom edge) set one distance each, e.g. higher above a
  banner; `offset` stays the distance from both edges and the default of the two. In HTML: `--wc-affix-offset-x` and
  `--wc-affix-offset-y`.
- 5b13204: DataTable: own content of a footer cell – the slot `#footer-<id>` (Vue) or the column option `renderFooter` (React)
  gets `value` (the total of `aggregate`, not formatted), `text` (what the cell shows by default) and `rows` (the filtered
  rows the total is computed from, every page, without group rows), e.g. for totals as badges. A column with only own
  footer content shows the footer row as well; the CSV export and printing keep the text.
- 5b13204: DataTable: `scroll` (Vue) / `onScroll` (React) reports every scroll of the table's scroll area – down and up with
  `scrollHeight` (also with `virtual`), sideways when the table is wider – e.g. to close a popover anchored in a row that
  virtual scrolling removes. `loadMore` stays as it was. In React `onScroll` was passed to the outer element before, where
  it never fired (that element does not scroll).
- a9fa66f: NotificationCenter:

    - Items without `href` can be `clickable`: their title becomes a button that reports `select` / `onSelect` (opt-in per
      item; items without both stay text). In React the event of `onSelect` is a `MouseEvent<HTMLAnchorElement |
HTMLButtonElement>` now.
    - `markAllRead` / `onMarkAllRead` gets the ids of the unread items shown (Vue, React and React Native), e.g. for one
      request to the server instead of one per item.

- 5a6e8cd: SidebarNav: router links like Menu and BottomNavigation – `linkAs` renders the links (RouterLink, NuxtLink, the Link of
  React Router or Next.js …) and gets `to` for items with `to`, else `href`. `currentHref` (the item with exactly this
  `href`) or `isCurrent` mark the current page with `aria-current="page"` and open its groups; an item's own `current`
  still wins.
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

### Patch Changes

- Updated dependencies [d1fec76]
- Updated dependencies [a9fa66f]
- Updated dependencies [efd24f8]
- Updated dependencies [b9d33fb]
- Updated dependencies [b9d33fb]
    - @wirecore/wirelayer-recipes@0.9.0
    - @wirecore/wirelayer-tokens@0.6.0

## 0.10.0

### Minor Changes

- bee9f54: `DataTable editTrigger="dblclick"`: a double click starts editing a cell, a single click only focuses it – for tables
  where a click should not open the editor by accident (e.g. while scanning or selecting text). The keyboard keeps
  starting it right away (Enter or Space on the cell, Enter/F2 in the grid navigation). The default stays `click`.

## 0.9.2

### Patch Changes

- 8317abc: `Calendar` and `DatePicker` with `allowDeselect`: clearing the chosen day keeps its month in view and the focus on that
  day. Before, the view jumped to today's month.
- dd4bee0: `Stepper` and `Wizard`: while the current step is busy – an async `validate` in the `Wizard`, `loading` on the item in
  the `Stepper` – "Next" shows a spinner and ignores clicks (`aria-busy`, `aria-disabled`) but keeps the focus. Before,
  only the step's number turned into a spinner, and a second click on the unchanged button looked like nothing happened.

## 0.9.1

### Patch Changes

- ad4939e: READMEs and the guide "Getting started": installation with npm, pnpm, Yarn and Bun (React Native: also
  `npx expo install`).
- Updated dependencies [ad4939e]
    - @wirecore/wirelayer-recipes@0.8.1
    - @wirecore/wirelayer-tokens@0.5.1

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

- 849eac6: `ContextMenu`'s `before-open` / `onBeforeOpen` gets a second argument `{ source: 'pointer' | 'keyboard', focused }`:
  opened with Shift+F10 or the menu key, `focused` is the element with the focus – a list can tell a row from its empty
  space even when the browser fires the event on the whole area. The first argument stays as it was.
  `createContextMenuSource()` in the recipes tells the two apart.
- 849eac6: Focus for dialogs and wizards whose content changes:

    - `data-autoselect` on a field in a `Dialog`: it gets the focus when the dialog opens, with its text selected (e.g. a
      prefilled name). Without it Ark's choice stays (an alertdialog's close button, `data-autofocus`, the first element)
    - `focusFirst(container)` (also from the component packages) focuses like opening does – `data-autoselect`,
      `data-autofocus`/`autofocus`, otherwise the first field; Vue's `DialogContent` exposes it as `focusFirst()`
    - `Wizard focusOnStepChange` moves the focus into each new step the same way (not after a failed check: the invalid
      field keeps it)
    - `autoselectElement(content)` in the recipes for a dialog's own initial focus

- 849eac6: Choices that cannot be empty give their value type without the empty value – no `$event && …` guard for a model that
  is never empty. Only the types change, unless noted:

    - `RadioGroup` and `SegmentedControl` with `required`: v-model / `onValueChange` get `V`, not `V | null`. A form reset
      back to an empty start (the only way Ark empties the group) is no longer passed on for a required group.
      `SegmentedControl` takes `required` now (`aria-required` on the group); React Native's `RadioGroup` is typed the same
    - `NativeSelect` without `placeholder`: `V`, not `V | ''` (only the placeholder option gives `''`)

- 849eac6: `NumberInput` with `emptyFallback`, for fields that always need a number (e.g. a port): an emptied field keeps its value
  while it is empty and falls back to `min` (or 0) or to the last valid number (`previous`) when it is left or Enter is
  pressed. v-model / `onValueChange` is then typed `number`. Without it an emptied field still reports null.

    Note for type code around the components: `NumberInput` (Vue) is generic now, so `InstanceType<typeof NumberInput>` and
    Storybook's `Meta<typeof NumberInput>` need a cast (as for Select).

- 849eac6: Token colours as fixed values for canvas libraries (xterm.js, charts) that cannot read CSS variables:
  `resolveTokens(element?)` gives the colours that apply right now (mode, theme and own overrides) as hex – `#rrggbbaa` for
  the translucent ones – and `watchTokens(onChange)` reports a change of mode, theme or system colour scheme. The
  composable/hook `useResolvedTokens()` keeps them up to date.
- 849eac6: `Select` with `emptyValue`, e.g. `""` for a model that uses an empty string for "nothing chosen": the value counts as
  null – the placeholder shows, no development warning about an unknown value – and clearing gives it back instead of null
  (typed `V | E`). Without it `""` is still an unknown value shown as text.
- 849eac6: `Tabs` for panels that live elsewhere (editor or terminal tabs, panes shown with `v-show`):

    - `TabsTrigger controls="pane-id"` points `aria-controls` at that element; `null` removes it (tabs without panels)
    - `Tabs` takes `null` as its value: no tab selected. The first enabled tab then stays reachable with Tab (Ark takes
      every tab out of the Tab order without a selection); Tabs without a value stay as they were

- 849eac6: Own texts in `Wizard` (and `Stepper`): `finishLabel` names the last button (default "Finish"), and a step's `validate`
  may return a text (also async) – it keeps the step open and is shown as its error instead of "Please check the entries
  in this step".

### Patch Changes

- 849eac6: Popups with a positioner (Select, Combobox, Menu, Popover …) stay above a dialog: the theme gives Ark's positioners
  `z-index: var(--z-index)` (in the base layer). Ark sets the z-index inline, but Vue removed it again whenever the popup
  rendered anew – the list then lay behind the dialog, looked closed and the pointer hit the dialog.
- Updated dependencies [849eac6]
- Updated dependencies [849eac6]
- Updated dependencies [849eac6]
- Updated dependencies [849eac6]
- Updated dependencies [849eac6]
- Updated dependencies [849eac6]
    - @wirecore/wirelayer-recipes@0.8.0
    - @wirecore/wirelayer-tokens@0.5.0

## 0.8.0

### Minor Changes

- ed18228: `Alert` takes actions – Vue slot `#actions`, React and React Native prop `actions` – e.g. "Workspace locked –
  [Unlock]": beside the text, below it when there is little room (React Native: below the text). Recipe slots `text` and
  `actions`, variant `hasActions`; without actions the DOM stays as it was.
- ed18228: `DialogContent` (React Native: `Dialog`) takes `titlePosition: 'body' | 'header'` (default `body`, as before). With
  `header` the title sits in the row of the close and maximize buttons, after a smaller icon, the header separated by a
  line – as on the Drawer; a long title wraps. Recipe variant `titleInHeader` for `dialog` (HTML: `wc-dialog-title-in-header`).
- ed18228: `Select` and `Combobox` report whether their list is open – Vue `v-model:open` / `update:open`, React
  `open`/`onOpenChange` – and take `stopKeyPropagation` (default `false`): the keys the list handles itself (Enter choosing
  or opening the list, Escape closing it, Tab leaving it) no longer bubble up, e.g. to a dialog that saves with Enter and
  cancels with Escape on the window. Escape on a closed field still reaches the dialog.
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

- ed18228: Focus API of the text fields. In Vue, `Input`, `PasswordInput`, `NumberInput`, `Textarea` and `MaskInput` expose
  `focus(options?)`, `blur()`, `select()`, `setSelectionRange()` and the native input as `element` (type
  `TextFieldHandle`) – a template ref is enough, no `ref.$el.querySelector('input')`. In React `ref` already reached the
  native input of Input, PasswordInput, NumberInput and MaskInput; `Textarea` now passes it to the native textarea, too
  (before, a `ref` was dropped). In a dialog, mark the field to start in with `data-autofocus` – the dialog moves the focus
  after the content mounted, so a `focus()` in `onMounted` or an effect is overridden (story "Dialog › Initial focus").
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

## 0.7.0

### Minor Changes

- e7ecc8e: ConfirmDialog: `confirmButton` and `cancelButton` (Vue `confirm-button`, `cancel-button`) set the look of its buttons
  for every request – `{ variant, color, size, shape }` as on Button; the same options in `confirm()` and `prompt()` win
  for one request. The defaults stay: size sm, cancel `outline`, confirm `primary` (`danger` with status danger). New
  type `ConfirmButtonOptions`.
- e7ecc8e: `FormField` passes `classes` on to its Field – e.g. `{ label: 'text-sm' }` – like every other component; before, the
  label could only be changed through the label slot. React's `FormField` also takes `className` now (Vue passed `class`
  through already).
- e7ecc8e: `DialogContent` and `DrawerContent` take `hideTitle` (Vue `hide-title`), like `PopoverContent`: the title stays the
  accessible name of the dialog but is shown for screen readers only – e.g. around a video. Recipe variant `hideTitle` for
  `dialog` and `drawer`.
- e7ecc8e: IconButton `loading`, like Button: a spinner instead of the icon, the name stays; the button stays focusable
  (`aria-disabled`, `aria-busy`) and ignores clicks – it does not submit its form either.
- e7ecc8e: DataTable `rowExpandable` (Vue `row-expandable`): `(row) => boolean` decides which rows have details (`expansion`). Rows
  without details get no expand button – their cell keeps its width, the columns stay aligned – and "Expand all" opens
  only the rows that have details. Without the prop every row can be expanded, as before.
- e7ecc8e: Smaller additions, the defaults stay:

    - Slider `hideLabel`: the label is for screen readers only – it still names the thumbs; without `showValue` the header
      takes no room (also in React Native, where the thumbs keep the label as their name)
    - Carousel `controlsPosition: 'bottom' | 'sides'` (default `bottom`): with `sides` previous and next sit beside the
      slides, vertically centred; autoplay and dots stay below
    - Tooltip `closeOnScroll` (default `true`, as before): `false` keeps it open while the page or a container around the
      trigger scrolls

- e7ecc8e: DataTable `bordered`: a border around the whole table, with or without `gridlines` (which keep drawing the lines between
  the columns only). Recipe variant `bordered` of `dataTable`.
- e7ecc8e: DataTable pagination: `paginatorEdges` (Vue `paginator-edges`) adds the buttons to the first and the last page,
  `paginatorAlign` (`'between'` – the default, rows per page at the start and the pages at the end – `'start'`,
  `'center'`, `'end'`) places the pagination row. Recipe variant `paginatorAlign` of `dataTable`. The standalone
  `Pagination` has `withEdges` already.
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

### Patch Changes

- e7ecc8e: DataTable `defaultSorting` (and a controlled `sorting`) now also sorts by a column without `sortable`. TanStack applied
  a sorting only to columns the user can sort and dropped the others without a word – the table showed the rows unsorted.
  The column still has no sort button and no sort entries in its menu; its header announces the order (`aria-sort`).
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

- e7ecc8e: Select, MultiSelect, VirtualSelect, Combobox and Listbox warn in development when a chosen value is not among their
  items – it shows as raw text, e.g. `'DE'` with items that carry country names. They warn once the items are there: not
  while loading, not without items, not with a data source (it resolves values later) and not for free text
  (`allowCustomValue`). Nothing changes at runtime. New in `@wirecore/wirelayer-recipes`: `checkListValues()`; options
  of such values carry `unknown: true`.
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
