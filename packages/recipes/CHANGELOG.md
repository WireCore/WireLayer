# @wirecore/wirelayer-recipes

## 0.14.1

### Patch Changes

- 8fe49e8: DatePicker, DateRangePicker and TimePicker: the parts announce their changes in the app's language again with Ark UI
  5.40 (`@zag-js/live-region` 1.47), e.g. "Jahr, 1990" instead of "Year, 1990". Its live region has no id
  `__live-region__` anymore and is created once when the field mounts; `translateDateAnnouncements` now finds the regions
  by `data-live-announcer` and works with both versions.

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
- ce8a9ae: DataTable: sorting by several columns can be set once for the whole app. The `dataTable` recipe gets a variant
  `multiSort` without classes of its own – `{ dataTable: { defaultVariants: { multiSort: true } } }` in the
  RecipesProvider/ConfigProvider lets Shift+click (and the column menu) sort every table by further columns, as
  `sortMode="multiple"` did on a single table; `sortMode` on a table still wins. As in the multiple mode, `sorting`
  (`v-model:sorting`, `onSortingChange`) is then an array.
- 83aa41e: Dialog and Drawer: whether a click outside closes them can be set once for the whole app. The `dialog` and `drawer`
  recipes get a variant `closeOnInteractOutside` without classes of its own – `{ dialog: { defaultVariants: {
closeOnInteractOutside: false } }, drawer: { defaultVariants: { closeOnInteractOutside: false } } }` in the
  RecipesProvider/ConfigProvider keeps every modal dialog and drawer open on a click outside (no lost input in form
  dialogs); the prop on a single `Dialog` or `Drawer` still wins.

    - `openDialog()` follows the default of the `dialog` recipe; its option `closeOnInteractOutside` wins over it.
    - `confirm()` and `prompt()` are alertdialogs and never close on a click outside – unchanged.
    - Docs: _Customizing_ lists the new default, the PrimeVue migration guide names it under _Pitfalls_. React Native has no
      RecipesProvider, the prop stays on the single dialog there.

- 3d79a05: React Native DataTable, like the web: `searchPlaceholder` sets the text and name of the search field; the column option
  `headerHint` puts an (i) button with an explanation next to the header (table layout); `footerPosition="top"` shows the
  totals right below the headers (cards: the total card before the cards). Recipe slots `headerWithHint` and `headerHint`, variant
  `footerTop`; story _Totals on top_.
- 1c190d0: TagsInput: every suggestion without typing. `openOnFocus` opens the suggestions when the field gets the focus or is
  clicked; `trigger` adds a button with an arrow at the end of the field that opens and closes them ("Show suggestions",
  not a tab stop – Arrow down does the same, the focus stays in the field). New recipe slots `trigger` and
  `triggerIcon`; story _All suggestions_.

### Patch Changes

- cc2c66c: DatePicker, DateRangePicker, MonthPicker and YearPicker: a date with a part emptied is no longer kept. Ark's segmented
  field only reports a change when every part is filled or every part is empty – deleting the year of "12.05.1990" left
  the old date in the model, a form saved it although the field showed "12.05.JJJJ". Now the field reports the dates
  before the incomplete one (`null` for a single date, only the start for a range) right after the key or when it is left,
  so a required field fails; the typed parts stay. Completing the date reports it again, also when it is the same as
  before.

    - The parts of the date and time fields (also TimePicker, TimeRangePicker and the times below the calendar) announce
      their changes in the language of the app instead of Ark's English ("Jahr, Leer" instead of "Year, Empty"): the part
      names from `dateSegments`, the new text `dateInput.empty` in every bundled language.
    - New helpers in the recipes: `partialDateIndex(root)` and `translateDateAnnouncements(element, texts)`.

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

## 0.9.0

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

## 0.8.1

### Patch Changes

- ad4939e: READMEs and the guide "Getting started": installation with npm, pnpm, Yarn and Bun (React Native: also
  `npx expo install`).

## 0.8.0

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

### Patch Changes

- 849eac6: Vite plugin: a component imported for the first time while `vite dev` runs gets its classes right away. The plugin added
  its sources file to the CSS, but Tailwind's Vite plugin only builds a CSS file again when a file it imports changes on
  disk – the classes were missing until a restart (cards without padding, tiny avatars). In the dev server the imports now
  live in a file in Vite's cache folder; the build is unchanged.

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
