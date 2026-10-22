# Roadmap and known limitations

## Status

Not released yet (as of October 2026).

- **Vue and React:** around 180 components (235 exports including parts such as `TabsList`) with an identical API and
  identical DOM, plus DataTable (feature set on par with PrimeVue and beyond), forms, charts, editor, CodeHighlight,
  PdfViewer, Scheduler and Gantt, visualizations, around 40 hooks/composables, `LocaleProvider` (English and German
  built in, eleven more languages plus pt-BR to register, RTL) and `RecipesProvider` for customization; subpaths `/form`,
  `/data-table`, `/virtual`, `/chart`, `/editor`, `/code`, `/pdf`, `/locales/<code>`
- **React Native:** around 145 components (174 exports) – forms and inputs with the prop names of the web (lists of
  arbitrary values, groups, search and loading more in bottom sheets, date/time, color, file and code inputs), TanStack
  Form via `@wirecore/wirelayer-native/form`; display (Statistic, Timeline, rings, Gauge, Carousel, Gallery with pinch
  zoom, QR code, Markdown …), feedback and overlays with `toast.promise`, `confirm()`/`prompt()`, `openDialog()`,
  navigation without a router (BottomNavigation, AppShell, NavigationMenu as a drawer), layout building blocks and hooks;
  data and complex building blocks: VirtualList, DataView, DataTable (`/data-table`, table or cards per row),
  Tree/TreeSelect/CascadeSelect/OrgChart, OrderList/PickList/Sortable/Kanban, Scheduler (list, day, week, month) and
  Gantt as a list, Chat, CommandPalette, EmojiPicker, JsonViewer, LogViewer, charts with react-native-svg (`/chart`) and
  visualizations, PdfViewer (`/pdf`), CodeHighlight (`/code`), sharing (`/expo-sharing`); Expo demo app with a form,
  display and data page
- **HTML:** `.wc-*` classes from 191 recipes (around 2,700 rules) for everything that works without JavaScript
- **Page blocks:** SiteHeader, CtaSection, ModeToggle, AuthForm, AuthLayout and ConditionBuilder (also the editor of
  the advanced DataTable filter) for Vue and React
- **Quality:** parity, SSR, axe (jsdom and browser, all modes and themes), keyboard/E2E and screenshot tests; license
  check of the dependencies
- **Docs:** Storybook with a getting-started guide per framework; MCP server and `llms.txt` for AI assistants
  (components, hooks, guides)

## Planned

**Release**

- [ ] Validate in real-world projects with Nuxt, Next.js, Expo and server templates (HTML) and incorporate the feedback.
      The demo apps in this repository only cover setup, SSR and hydration so far
- [ ] 1.0.0 after this validation
- [ ] Have the translations fr, es, it, pt, pt-BR, nl, pl, cs, hu, lv, ar, tr (`packages/recipes/src/locales`) reviewed
      by native speakers

**Decisions**

- [ ] Define and document browser and platform support (web: Tailwind v4's requirements; mobile: the minimum versions
      of Expo SDK 58)
- [ ] Versioning and breaking change policy: SemVer, all packages with the same version (`fixed` in the Changesets
      configuration)?

**Accessibility**

- [ ] Screen reader spot checks before 1.0: NVDA and VoiceOver on the web, VoiceOver and TalkBack for React Native –
      especially for complex widgets (DataTable, Scheduler, Tree with reordering, Editor)

**TypeScript, tooling and tests**

- [ ] Evaluate `isolatedDeclarations` – makes `.d.ts` generation independent of the TS compiler (oxc/tsdown) and faster
- [ ] CI job “ts-deprecations”: build with warnings as errors so that nothing deprecated slips in
- [ ] **Migrate to TypeScript 7.x** once 7.1 is stable **and** `vue-tsc` and `typescript-eslint` support it (see
      [architecture.md](architecture.md#typescript))

## Known limitations

**Web components (Vue and React)**

- [ ] Right-to-left with the English fallback (e.g. `he-IL`): the pagination summary “1–4 of 6” is rendered with
      reversed bidi order (“of 6 4–1”, screenshot `react-rtl-…-datatable--playground`) – isolate the number ranges
      (`<bdi>`/`dir="auto"`) or add a translation
- [ ] DataTable: pinned rows are editable but not part of the grid keyboard navigation (`navigation="grid"`); the
      automatic width with virtualization measures texts (canvas), not the content of `cell`/copy buttons
- [ ] DataTable: groups and tree rows collapse on every change of `data` (TanStack `autoResetExpanded`) – switched off
      with `reorderableRows` and `cellSelection`, not yet otherwise (behavior unchanged so far)
- [ ] DataTable `advancedFilter` with pivot: the cross table computes over all `data` (the filter does not apply there)
- [ ] DataTable: batch editing does not re-sort changed values; pasting in row mode reports `cellEdit`
- [ ] DataTable: fill handle (dragging a value into neighboring cells) – deliberately left out; a single pasted value
      fills the selected range
- [ ] Scheduler: dragging events outside works via pointer events (`eventDropOutside`), not via native drag and drop; in
      the month view, dragging only moves by whole days (the time stays)
- [ ] Scheduler/iCal: `VTIMEZONE` lists every transition in the years of the events individually (from Intl, without
      `RRULE`); open-ended recurrences only cover one year after their start
- [ ] Server data: Timeline, ChatMessages and Gallery only load manually (`loadMore`); Kanban and Gantt deliberately have
      no `dataSource` (cards/tasks are app state) – see the overview in
      [architecture.md](architecture.md#server-data-and-loading-more)
- [ ] Selection lists: the values `1` and `'1'` result in the same key; TagsInput/Autocomplete suggestions without
      groups
- [ ] Tree: after the first move with `loadChildren`, the loaded children are in the app's `items` (`move.items`) –
      `invalidate()` no longer reloads them
- [ ] CascadeSelect `expandTrigger: 'click'`: without hover opening, the mouse no longer highlights items with a
      submenu either (Ark couples both)
- [ ] Sortable: OrderList still uses its own listbox logic (DOM unchanged)
- [ ] Kanban: the WIP limit is only a hint (no blocking); columns themselves cannot be reordered; collapsed columns do
      not accept cards
- [ ] MegaMenu: the parity test does not compare the open drawer (mobile) because the harness cannot click – it is
      checked in the behavior and browser tests
- [ ] Toolbar: nested Ark widgets with their own roving focus (ChipGroup, SegmentedControl) are not part of the
      toolbar's arrow keys; groups of ToggleButtons work
- [ ] Banner/AppShell/Splitter with `storageKey`: the server does not know the stored state – a dismissed banner or a
      stored width only appears after hydration
- [ ] OverflowList/Truncate only measure in the browser: the server shows everything up to `maxVisible` or the text
      without tooltip/“Show more”; `FormatRelativeTime` is only identical on server and client with `now`
- [ ] Editor: images uploaded by pasting/dropping get `alt=""` – the alternative text is set afterwards via the image
      tool (select the image)
- [ ] Editor colors are stored as `var(--wc-…)` in the HTML – outside pages with WireLayer styles (email, PDF) the
      variables are missing. Content from older versions (text color without mixing, 25 % tint) does not reach 4.5:1 in
      every combination
- [ ] `/editor` imports the new Tiptap extensions statically – apps using `/editor` need the additional (optional) peer
      packages
- [ ] Markdown: deliberately without images (they become links), HTML, reference links (`[a][1]`), Setext headings and
      indented code blocks
- [ ] EmojiPicker: no skin tones; names and search terms in English and German, the language modules have none of their
      own yet (`emojiPicker.emojis` is empty – English)
- [ ] PhoneInput checks the length per country, not a complete numbering plan (that would need libphonenumber-js as an
      optional subpath); with +1 the selected country (US/CA) stays
- [ ] LogViewer renders lines with a fixed height (no wrapping, horizontal scrolling); `rowHeight` must match custom
      styles
- [ ] ChatMessages: date rows and times in the browser's time zone (pass `now` for “Today/Yesterday” from the server);
      long conversations are not virtualized
- [ ] Charts: labels of reference lines without collision avoidance; Brush only for Bar/Line/CompositeChart
- [ ] SessionTimeout does not count activity – the app sets `expiresAt` again (e.g. from the server session) after every
      extension
- [ ] Gallery: the Storybook example for video slides has no real video file (only poster and caption track) – add a
      small freely licensed sample file
- [ ] Percentages are written as “42 %” (German typography) instead of following the locale – MeterGroup, Progress,
      ProgressCircle, RingProgress, Spinner, ImageCropper/Gallery zoom, PdfViewer zoom announcement, ColorPicker (RN);
      format them with `Intl.NumberFormat(locale, { style: 'percent' })`
- [ ] Button/IconButton: the default `badgeLabel` (“4 new”) is not taken from the translations – pass `badgeLabel` for
      other languages
- [ ] `registerLocale` after the first render does not reach components that are already rendered – register before
      rendering (as documented)

**React Native**

- [ ] Deliberately simplified or left out (part 3): DataTable without column resizing, reordering/pinning/hiding, cell
      editing, cell selection/clipboard, pivot, printing, tree rows, `stateKey`, advanced filter and several conditions
      per column (one comparison via `filterMatchMode`), grouping by one column only; Tree without reordering/dragging
      between trees; OrderList/PickList without dragging (buttons and accessibility actions), Sortable without a grid
      (`columns`), between lists only by tapping/actions; Kanban without dragging between columns (action sheet);
      Scheduler without timeline, year, resource columns, resizing and dragging outside; Gantt as a list (only the
      progress can be changed, no dragging/linking/zoom); charts without CompositeChart, WaterfallChart, second axis, log
      scale and Brush; CommandPalette/EmojiPicker without arrow key navigation; LogViewer without a fixed line height;
      PdfViewer without text layer, search, password dialog and printing; no rich text editor (Tiptap needs DOM/WebView
      – a textarea plus Markdown preview instead)
- [ ] Check part 3 on devices: dragging via the responder system (Sortable, Kanban within a column, Scheduler time grid)
      on iOS/Android, Shiki grammars on Hermes (JS RegExp engine targeting ES2018), PdfViewer in the dev build,
      `Intl.ListFormat`/`formatRange` on Hermes, nested sheets (Select in the DataTable's filter sheet) on iOS; reading
      order of the inverted ChatMessages
- [ ] Deliberately simplified or left out (part 2): Splitter (too narrow on phones, dragging without a good
      alternative), `useNetwork` (would need NetInfo/expo-network), Banner/AppShell without `storageKey` (the app stores
      via `onDismiss`), Gallery without video slides, Image/QrCode without download, Timeline without
      `orientation="horizontal"` and `autoLoad` (FlatList apps call `onLoadMore` from `onEndReached`), Pagination
      without `jumper`, Menu without search, Popover only above/below its trigger, Sticky as a bar outside the
      ScrollView (`stickyHeaderIndices` for headers inside the content), Kbd only for hardware keyboards
- [ ] Check on iOS: several modals at once (`confirm()` from an `openDialog()` dialog – the DialogHost dialogs are
      nested, ConfirmDialog sits next to them), Tour cutout and Popover position with a translucent status bar
      (Android)
- [ ] Forms, deliberately simplified: ColorPicker without area, opacity and formats (hex only); FileUpload without
      dropping/pasting (the app provides the pickers); InlineEdit without `mode="popover"`; Mentions with one trigger;
      Listbox without dragging; chips in MultiSelect without their own remove buttons (removing happens in the sheet);
      DateRangePicker/TimePicker without typing the time on a keyboard
- [ ] Spot checks with VoiceOver and TalkBack: announcements (`announceForAccessibility`), focus after
      FormErrorSummary, Rating/Slider as adjustable elements, actions of the FormList items
