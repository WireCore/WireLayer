# Implementation notes

What we learned while building WireLayer – pitfalls of the tools and libraries and how the code works around them.
Worth reading before changing the affected areas.

## Tools, Docker and Storybook

- **pnpm 12** has been stable since August 2026 and is used. The store lives in `node_modules/.pnpm-store`.
- **pnpm security defaults:** packages are only installed once they are 1 day old (`minimumReleaseAge`). This is
  intended and is not circumvented. When a version range is too fresh, pnpm adds `minimumReleaseAgeExclude` itself – that
  entry is reverted and an older, released version is used instead (`~58.0.0`).
- **The export condition `source` is ambiguous:** `@internationalized/number` (from Ark) uses it as well and thereby
  pulled its TypeScript sources into our type check. Our condition is called `wirecore:source`.
- **Storybook composition in Docker:** the host checks its refs on the server at startup. All Storybooks therefore share
  one network namespace (`storybook-net`), and the host only starts once Vue and React are healthy.
- **Storybook composition does not pass globals on to composed Storybooks** (“globals from a non-local ref … not
  supported”). The color scheme switcher in the host therefore sends the theme via `postMessage`
  ([apps/storybook/shared/theme.ts](../apps/storybook/shared/theme.ts)). The “Preview background” addon is switched off
  because it only changed the hidden page background. The a11y panel also exists only in the individual Storybooks
  (:6007/:6008).
- **The Storybook a11y addon** starts axe itself. The browser check uses its instance and runs with
  `prefers-reduced-motion`, otherwise axe measures in the middle of the color transition when the theme changes.
- **Dev Storybooks (development only, not builds/CI):** the first time a story with a new Ark component is opened, Vite
  optimizes the dependencies and reloads the page. A new `--animate-*` variable in `@wirecore/wirelayer-tokens` only
  reaches the running Vue/React Storybooks after a restart (until then Tailwind does not generate the utility). After new
  exports from `@wirecore/wirelayer-recipes`, Vite served an old version of `i18n.ts` (“does not provide an export named
  …”) – restart the container. `pnpm --filter @wirecore/wirelayer-css build` deletes `dist/`, and the watcher of the HTML
  Storybook loses it – restart `storybook-html` afterwards.

## Ark UI – gaps we close

- **Ark gaps we close:** the `progressbar` got the value as its name instead of the label. The `SegmentGroup` was
  vertical by default. The switch had no `role="switch"`. The pagination was labeled in English only.
- **More Ark gaps:** `Popover.CloseTrigger` labels custom buttons with “close” (replacing the visible text) –
  `PopoverClose` therefore closes via the context. Popover title/description are not linked with `lazyMount` – own IDs.
  The DatePicker does not attach to `Field` – we do the linking (label, status, description) ourselves.
- **Even more Ark gaps (overlays):** Ark Vue's `Pagination.Root` does not pass `boundaryCount` on to the machine – Vue
  therefore uses `usePagination` + `RootProvider`. A toast that was updated from `loading` to another type ignores
  `toaster.dismiss()` afterwards – `toast.dismiss()` then removes it itself after the exit duration. Menus ignore
  `positioning.getAnchorRect` (they set their own) – points go in as `anchorPoint`, elements as `getAnchorElement`.
- **Ark gaps with dates and times:** the inline `Calendar` has no `DatePicker.Content`, but Ark looks for the day to focus
  inside it. The arrow keys therefore only changed the highlighted day, not the focus; the root now stands in for the
  content via `ids`. With several months, the days of the neighboring month create duplicate IDs (the focus landed in
  the invisible duplicate) – they are rendered as empty cells. Ark hides the weekday header from screen readers
  (`aria-hidden`); the calendar weeks are therefore named as row headers (“Week 43”). A click into a completed range does
  not move the focus in Ark (found by the E2E test).
- **Ark gaps with trees and lists:** Ark's checkbox cascade counts a branch without loaded children as checked (`every`
  over an empty list) – with lazily loaded nodes, `checkStrictly` or `checkedStrategy` the Tree therefore computes the
  state itself (`@wirecore/wirelayer-recipes`, `tree-data.ts`). Ark Vue's `TreeView.Root` does not pass `scrollToIndexFn`
  on to the machine – the VirtualTree uses `useTreeView` + `RootProvider` in Vue. The options of Ark's Listbox prevent
  the default behavior of `mousedown` (the focus stays in the list); that also prevents dragging – PickList/OrderList
  catch the press with `draggable` first, and the browser focuses the list itself.
- **Ark gaps in the NavigationMenu (MegaMenu):** Ark's `Content` closes as soon as the pointer leaves the panel – even
  with `disableHoverTrigger`, i.e. also when opened by click – and names the panel with `aria-labelledby` (not allowed on
  a `div` without a role). The MegaMenu therefore renders the panel itself with Ark's content props minus these three;
  hover (delay, safe triangle, instant switching, never on touch) is handled by `createHoverIntent` from
  `@wirecore/wirelayer-recipes`, Ark's hover is off.
- **Ark gaps in the newer building blocks:** Ark Vue's `AngleSlider.ValueText` loses its attributes with custom content
  (the value is therefore a separate display). `FloatingPanel.CloseTrigger` is hard-coded to “Close Window”, the
  `SignaturePad` has the role description “signature pad” and a `<title>Signature</title>` in its SVG – own names or
  `aria-hidden`. The pause on hover/focus of the `Marquee` would undo a pause set by the button – the component controls
  the pause itself; Ark knows no reduced motion (the animation only runs with `motion-safe:`). Ark's `Select` and
  `ColorPicker` take over the IDs of a surrounding `Field` – second controls inside it (the country of the PhoneInput)
  get `standalone`, the color button of the ColorInput its own name.
- **Focus after Ark dialogs:** `finalFocusEl` is only called on close – the function looks the element up again at
  that point. That way the focus lands on the (re-rendered) event after the recurrence prompt instead of on a removed
  element.
- **Numbers in German format:** Ark reads the value of a NumberInput with the locale – “1234.5” would become 12345 in
  `de-DE`. Values are therefore passed formatted (“1.234,5”), and without `formatOptions` Ark does not format at all (we
  set a default).
- **Ark Rating:** `setValue()` takes the value under the pointer while one is hovered – clearing (`allowClear`)
  therefore uses `clearValue()` (Ark: −1, 0 to the outside).
- **Ark toasts** are stacked via CSS variables (`--x`, `--y`, `--height` …) that the styling has to apply. Without them
  the toasts lay on top of each other. The tests were green anyway; only the screenshot comparison found it.
- **Toggletip without Ark's Popover:** Ark's Popover is a `dialog` and moves the focus. The Toggletip is its own logic:
  a button plus a `role="status"` region into which the bubble is inserted on open (announcement); the focus stays on
  the button.
- **Ark UI Vue** wires up `aria-describedby` only after mount. Tests therefore wait for a `nextTick` so that Vue and
  React are comparable.

## Vue and React

- **Vue component names** have no prefix (`Button`, `Input`) – decided, identical to the React API.
- **Naming:** light/dark is `data-mode`, the color theme `data-theme`, as in PrimeVue. Previously `data-theme` meant
  light/dark; renamed before the first release.
- **Vue renders asynchronously:** in the controlled NumberInput, Ark wrote the formatted value back before Vue passed
  the typed text on – a comma disappeared. Vue therefore keeps the text itself and passes changes from outside on via
  Ark's API.
- **Vue renders `class=""`** when an Ark part gets `:class="undefined"` (React omits the attribute). Optional classes
  are therefore bound via `v-bind="cond ? { class } : {}"`.
- **Vue boolean props:** a boolean prop without a default is `false`, even when `undefined` is passed. Inner components
  therefore use negative names (`hideClear`, `plainToday`), and the public props (`clearable`, `highlightToday`) default
  to `true`.
- **Generic Vue components** (`generic="T …"`): type exports must come before the first statement (“Modifiers cannot
  appear here”), and types used in the `generic` attribute must be imported (`DateRangePicker/types.ts`).
- **Vue SSR and `valueOf`:** a function `valueOf` from `<script setup>` made server rendering resolve to
  `Object.prototype.valueOf` (“Cannot convert undefined or null to object”). Do not name helper functions like methods of
  `Object`.
- **Stored settings in React:** `react-hooks/set-state-in-effect` forbids taking values from `localStorage` via
  `setState` in an effect. Banner and AppShell read the entry with `useSyncExternalStore` (`storage.ts`, `null` on the
  server and during hydration) and keep their own changes in state.
- **Hydration and generated IDs:** a default value with a random ID (ConditionBuilder root) differs between server and
  browser – the root is therefore always called `root`, new nodes only get IDs on user actions.
- **Returning focus:** `useFocusReturn` remembers the focused element synchronously on open (Vue `flush: 'sync'`, React
  layout effect) – otherwise a focus trap has already moved the focus.
- **Focus after reordering (React):** the next arrow key arrived before the focus was on the moved item (moving between
  lists, found by the E2E test). Sortable therefore renders the new order with `flushSync` and focuses immediately; Vue
  focuses after `nextTick`.
- **Multi-part texts in React:** `{a} · {b}` creates several text nodes in React, Vue's `{{ a }} · {{ b }}` one – the
  DOM comparison flagged it. Composed texts are template strings in React.
- **Vue `v-model` with `undefined`:** a `v-model` without a value writes `''` into the textarea on mount and thereby
  overwrites `defaultValue` (jsdom did not show it, the browser test did). `defaultValue` is therefore a prop that
  initializes the internal text.
- **Explicit `undefined` in props:** `aria-label={undefined}` after spreading the field props overwrites the field name.
  Fields only pass their own names on when they are set.
- **React Compiler rules:** refs may neither be read nor written during render – “latest props” for later callbacks
  (loaders, data sources) are synced in an effect, and state that matters during render is state.
  `react-hooks/exhaustive-deps` applies only to `.tsx` files; in `.ts` hooks a disable comment for it is an error.
- **React Compiler and render props:** functions that are passed to `renderItem`/`renderEditor` during render and write
  a ref are reported by `react-hooks/refs`. Focus requests after render therefore go through state (`{ index, pick }`)
  and an effect.
- **React Compiler and functions during render:** `toggleOnSpace(choose)` is called during render – if `choose` reads a
  ref (through further functions), `react-hooks/refs` reports an error. Kanban and DataTable therefore keep such values
  in state or set the data source only in the effect.
- **Controlled form elements:** Vue additionally writes the value of a `<select>` as the attribute `value` (which
  `<select>` does not know), React only sets the property – the DOM comparison ignores this attribute. For `<textarea>`,
  React writes the value as text content and Ark Vue's factory additionally as an attribute – the passed value is
  compared (attribute, otherwise text content). For `<input>`, React additionally writes the value as an attribute
  (`defaultValue`), Vue only sets the property – the current value is compared.

## Logic, data and formats

- **TanStack Table sorts numbers descending first.** Columns set `sortDescFirst: false` so that the first click sorts
  ascending everywhere, as `aria-sort` announces.
- **TanStack `autoResetExpanded`:** new `data` collapses all groups and tree rows by default. It showed immediately when
  moving rows between groups (the focus got lost) – it is switched off with `reorderableRows` and `cellSelection`.
- **Validating on blur swallows clicks:** if a field's error text disappears when the field is left, the fields below
  move up between `mousedown` and `mouseup` – the click lands elsewhere. Recommendation (and story): `revalidateLogic()`
  – errors only after submitting, then live while correcting.
- **Standard Schema and TanStack Form:** an optional `types` field with a different input type makes a validator
  incompatible with TanStack's types (`StandardSchemaV1<TData>`). Our validators (function and schema at the same time)
  therefore do not declare it; TanStack uses `~standard` at runtime.
- **TanStack store in Vue:** `useStore` updates synchronously – after `field.pushValue()` the length is already the new
  one. FormList remembers the index beforehand (found by the behavior test).
- **Clipboard:** the browser sends `copy`/`paste` to the text selection, not to the focused element – after the arrow
  keys in the grid, Ctrl+C would arrive at `body`. The DataTable therefore listens on the document and checks whether
  the focus is inside the table. In jsdom, user-event only copies a text selection; the test dispatches the `copy` event
  itself, the browser test uses the real clipboard.
- **Selection lists with arbitrary values:** Ark only works with strings. `@wirecore/wirelayer-recipes`
  (`list-items.ts`) maps every value to a key – strings stay unchanged (form values and DOM as before), objects by
  `valueKey` or content. The original value goes to the outside; the component remembers labels of selected values that
  are not (or no longer) among the items (server search, loading more).
- **Time zones without Temporal:** Node 26 knows Temporal, Safari and Firefox (browser target) not consistently yet. The
  conversion in `@wirecore/wirelayer-recipes` (`date-time.ts`) uses `Intl.DateTimeFormat` and behaves like Temporal's
  `compatible`: a time in the gap of the daylight saving change moves forward by the gap, a repeated time in autumn is
  the earlier one.
- **Recurrences according to RFC 5545:** the start (`DTSTART`) always counts as the first occurrence, even if it does
  not match the rule; `COUNT` includes excluded (`EXDATE`) occurrences. Days that do not exist in a month (31st, “5th
  Monday”) are skipped, not moved.
- **JSON error positions:** V8 no longer reports a position for `JSON.parse` (“… is not valid JSON”). `jsonErrorOffset`
  finds the position itself (a small scanner) – JsonInput shows line and column in every browser.
- **Percentages:** `Intl` puts a non-breaking space before `%` in many locales. `toHaveTextContent` normalizes it,
  `toEqual` does not.
- **Arabic digits:** ICU gives `ar` Latin digits and `ar-EG` Arabic-Indic digits. The language modules format with
  `ar`; only `localizeTexts` with the active locale makes the digits consistent.
- **QR code without new logic:** the matrix comes from `uqr` (MIT, no dependencies) – the same encoder that Zag/Ark use
  on the web; `qrCodePath` in `@wirecore/wirelayer-recipes` turns it into an SVG path (runs of a row as one rectangle).

## Tests (jsdom, user-event, axe, Playwright)

- **jsdom gaps** ([setup.ts](../packages/parity/src/setup.ts)): Ark's positioning needs `ResizeObserver`/`scrollTo`
  polyfills, Ark's Splitter and the AppShell handles need `setPointerCapture`, ProseMirror (scrolling to the selection)
  needs `Range.getClientRects`. `getContext('2d')` is missing – `textColumnWidth` returns 0 there. Keyboard, focus,
  keyboard resizing and text widths are therefore checked by the browser tests.
- **Virtual lists:** jsdom cannot virtualize (no layout dimensions) – `VirtualSelect`/`VirtualTree` are tested in the
  browser. In a flex container the spacer needs `shrink-0`, otherwise it shrinks (VirtualSelect could not be scrolled,
  in the VirtualTree `End` landed in empty space – found by the E2E test). Ark focuses in the next frame after
  `scrollToIndexFn`; the row sometimes appears only after that, so the VirtualTree retries the focus for a few frames.
- **Browser axe finds more than jsdom:** it found a “Label in Name” violation (2.5.3) for the icon button counters that
  jsdom had not reported. That is why both checks run.
- **jsdom/user-event and Ark input fields:** user-event remembers typed text even when Ark clears the field right
  afterwards; fast typing overtakes Ark's sync of the field (React effects). Tests type there with a short delay or clear
  the field first – neither happens in the browser (E2E).
- **Server data in jsdom:** if the items of a virtual list only arrive after the first render (data source), TanStack
  draws no rows in jsdom (the scroll area measures 0 px). The behavior tests check requests and announcements there, the
  browser test checks the rows.
- **Names from several `<span>`s in jsdom:** jsdom puts no space between the inline parts of a button
  (“Review10:00–11:00”), the browser does (flex children are blocks). Behavior tests check such names with an optional
  space, browser tests with one.
- **Spaces in hidden text parts:** jsdom loses a space at the end of an `sr-only` `<span>` before the following text
  (“Unread:Backup”), the browser does not. The space therefore sits outside the `<span>`.
- **user-event:** `{` and `[` start key descriptors – the tests type JSON as `{{` and `[[`.
- **Shiki in the parity cases:** the highlighting arrives asynchronously – to a different extent in Vue and React
  depending on timing. DOM cases therefore use plain text; behavior and browser tests check the highlighting.
- **Failed requests and `networkidle`:** pdf.js throws on an error status before reading the response body and keeps the
  request open, so Playwright's `networkidle` was never reached. The PDF engine therefore destroys the loading task when
  loading fails, which aborts the request.
- **Vitest workers and memory:** the default is one worker per core; each holds jsdom with Vue, React and Ark (~300 MB).
  On 24 cores that was ~6.5 GB – next to the dev Storybooks the machine started swapping, runs stalled for minutes and
  time-dependent tests failed. `maxWorkers: 6` is just as fast (parity.test.ts determines the duration).
- **Static Storybooks:** the small server (`scripts/serve.ts`) has to serve `.mjs` as JavaScript, otherwise pdf.js does
  not load its worker. The browser a11y run opens a new page every 50 checks – a reused page grew to several GB.
- **Focus after a render (React):** a focus target that an event sets and an effect fulfills belongs in a layout effect
  – a still pending passive effect of an earlier render can otherwise consume it first (DataTable: F2 right after
  saving).
- **Search field in lists:** when the focus is in the search field (VirtualSelect with `filter`), Home/End stay with the
  caret – browser tests scroll the list directly.

## Styling, CSS generator and contrast

- **Generated CSS classes:** variants apply via `:is(.wc-x-value, .wc-x-value *)` to the element and all parts inside
  it, defaults via `:not(…)`. That way the specificity matches the order of tailwind-merge (part < variant < compound).
  Markers like `group/item` cannot be `@apply`ed and become `in-[.wc-…:first-child]:`.
- **Generator and tailwind-merge:** in the recipes, `text-xs` removes an earlier `leading-*` (tailwind-merge); in
  `@wirecore/wirelayer-css` both end up in separate rules – Tailwind then takes the line height from `leading-*`.
  Variants that change the font size of a part with `leading-*` therefore set the line height explicitly
  (`text-xs leading-4`). The HTML style comparison found this.
- **The CSS generator test** reads `packages/css/dist`, and its build takes `@wirecore/wirelayer-recipes` from `dist`.
  After changing recipes, build `recipes` first and then `css` – otherwise the test checks the old state and does not
  report new variants.
- **Marker groups and the CSS generator:** `group-open/<name>:` cannot be translated into `.wc-*` rules (only pseudo
  classes like `:hover`). For `<details>`, `in-open:` sits on the child.
- **Tailwind `grid-cols-(--x)`** sets the value unchanged as `grid-template-columns` – a number needs
  `grid-cols-[repeat(var(--x),minmax(0,1fr))]`. Found while reviewing the EmojiPicker in the browser.
- **Native `<dialog>`:** the recipe class sets `display:flex` and would show the closed dialog – `src/native-elements.css`
  handles `dialog.wc-dialog` (incl. `::backdrop`) by hand.
- **Animations** are only switched on via `motion-safe:`. A later `motion-reduce:animate-none` loses against the more
  specific `data-[state=…]` selector. The E2E test that checks the animation in the browser found this.
- **Animation and pause:** the `animation` shorthand resets `animation-play-state`. The pause of the toast progress bar
  therefore hangs on a more specific selector (`[[data-paused]_&]:`), not on `in-data-[paused]:` (`:where()` has no
  specificity). Found while reading the generated CSS.
- **AvatarGroup:** separating border as an inner `border` (as in the design). A `ring` sits outside and thereby covers
  the neighbor's initials.
- **Lucide and `fill`:** an explicitly passed `fill={undefined}` replaces Lucide's `fill="none"` – the icons were filled
  black. `Icon` only sets `fill` for filled symbols (Rating).
- **Contrast:** several color pairs from the original design were below AA and were adjusted (see
  [accessibility.md](accessibility.md)).
- **Info and warn buttons** only fade to 90 % on hover (`hover:opacity-90`): at 85 %, white text would drop below 4.5:1.
  Tinted buttons (`soft`) use the tint of the badges (`/10`, hover `/14`), colored outline/text buttons `/8` – all pairs
  are in the token contrast test.
- **Contrast on bg-2:** tinted badges and the hover of `soft` buttons were at ~4.2:1 on `bg-2` (light only). Status
  tones are darker (`info` 0.50, `warn` 0.505, `danger` 0.515); the contrast test now checks every tint on bg, bg-2 and
  card.
- **Tinted selection and tinted badges:** a badge (`success/14`) on a selected row (`primary/8–10`) dropped to ~4.2:1.
  Selected rows and nodes in RN now only tint `primary/5` (the border carries the state), and so do highlighted code
  lines.
- **Editor colors:** colored text on a colored background (25 %) often only reached ~3:1. Text colors are mixed with
  `fg` by a quarter (`color-mix(in srgb …)`), backgrounds 20 % – all pairs are in the token contrast test.

## Accessibility in detail

- **Descriptions in links:** if the description is inside the link, it is part of the accessible name. Panel links with
  a description are therefore named only by text and badge via `aria-labelledby`, and the description is attached via
  `aria-describedby`.
- **Chat and live regions:** a `role="log"` would announce a streamed answer on every token. The list has
  `aria-live="off"` and `aria-busy` while streaming; announcements come via the LiveAnnouncer (new messages from others,
  streamed ones only when complete).
- **axe and chips:** the name “Locations: Frankfurt, Vienna” did not contain the chips' visible text “Frankfurt Vienna”
  (comma) – `label-content-name-mismatch`. In chip mode the name separates with spaces; the same goes for buttons with a
  counter (“Notifications 4 new”).
- **Textarea as a combobox:** axe does not allow `role="combobox"` on `<textarea>` – Mentions links the suggestions only
  via `aria-controls`/`aria-activedescendant`.

## Editor and PDF

- **Tiptap menus in React:** `BubbleMenu`/`FloatingMenu` create their element with `document.createElement` during
  render – they are only rendered once the editor exists (never on the server).
- **pdf.js in the viewer:** `pdf_viewer.mjs` reads the API from `globalThis.pdfjsLib` when it loads – import and set
  `pdf.mjs` first, then the viewer. Its container must be absolutely positioned. pdf.js hands bytes to its worker (the
  caller's buffer would be empty afterwards) – the engine copies them. pdf.js appends the structure of tagged PDFs as
  fallback content to the `<canvas>` (roles with `aria-owns` pointing to the text layer); the browser test checks this
  link because Playwright does not find the heading by role.
- **pdf.js layers:** `textLayerMode` and `annotationMode` only apply when the `PDFViewer` is created. Switching them
  rebuilds the viewer (page, zoom and rotation are kept). Printing uses CSS named pages (`@page s0 …`, `page: s0`) so
  that portrait and landscape stay mixed. `AbortSignal.any` is missing in Safari 16.4.
- **pdfjs-dist and Node canvas:** pdf.js optionally brings `@napi-rs/canvas` (native binaries, Node only). Fresh
  platform packages of it added `minimumReleaseAgeExclude` – pnpm now ignores the dependency
  (`ignoredOptionalDependencies`), rendering only happens in the browser. In the jsdom tests pdf.js is a stub
  (`setup.ts`), the viewer stays in the loading state.

## React Native

- **Expo pins React** (SDK 58: React 19.3.0, RN 0.88.0). `@wirecore/wirelayer-native` uses the same versions, otherwise
  Metro bundles two copies of React.
- **Uniwind and themes from packages:** Uniwind translates package imports of the CSS file one by one to find theme
  variants – custom themes are still unknown there on the first pass. `native.css` therefore declares them itself, and
  `@wirecore/wirelayer-native/styles.css` imports Tailwind's theme and `uniwind` as well.
- **react-native-web** only triggers Space on `role="button"` (Checkbox/Switch additionally toggle with Space on the
  web) and sets no focus when a modal opens – the dialog focuses its close button itself. The E2E tests (with animation)
  found this.
- **react-native-web** wraps every modal in its own unnamed `dialog`. Our sheets and dialogs are marked up as a named
  dialog inside it.
- **react-native-svg** loads native TurboModules in the web build that Vite cannot resolve. The Storybook therefore uses
  `lucide-react` (same icons and props); apps keep `lucide-react-native`.
- **React Native in Storybook:** react-native-svg cannot be bundled in Vite (see above); the RN Storybook replaces it via
  an alias with a small DOM SVG stand-in (`.storybook/react-native-svg.tsx`) (Svg, Path, Circle – SignaturePad, rings,
  Gauge, QR code; with `viewBox` in the flow, without overlapping the drawing area). A `""` text as a child of a View
  (`{hint && …}` with an empty string) breaks react-native-web – conditions use `!!`.
- **React Native – announcements on the web:** react-native-web does not know
  `AccessibilityInfo.announceForAccessibility` (empty function). `useAnnouncer` announces via AccessibilityInfo on
  iOS/Android and renders a hidden `role="status"` region on the web.
- **React Native – roles:** `listbox` and `aria-pressed` do not exist in the RN types. Suggestion lists get `listbox`
  only on the web (iOS/Android read a list), toggle buttons `aria-pressed` on the web and `accessibilityState.selected`
  natively. Selection lists in sheets and the Listbox are radio or checkbox groups – VoiceOver and TalkBack announce
  these states reliably.
- **React Native – roles in menus:** `menuitemcheckbox`/`menuitemradio` do not exist in RN. Menus with checkbox/radio
  items are therefore not a `menu` list but checkbox and radio groups (like the selection lists); pure action menus stay
  `menu`/`menuitem`. The BottomNavigation is a tab bar (`tablist`/`tab`, selected) – that is how VoiceOver and TalkBack
  announce tab bars; on the web additionally `aria-current="page"`.
- **React Native – modals on the web:** react-native-web only calls `onShow` when `visible` changes, not for a modal
  that is mounted visible (`confirm()`, `openDialog()`) – the dialog therefore sets the focus in an effect (a field with
  `autoFocus` keeps it). Its `TextInput` stops `keydown` (Escape in the field did not arrive) – `useEscape` listens in
  the capture phase. A closing dialog must not nest following ones in its (invisible) modal, otherwise the next one only
  appeared after the fade-out – both found by the E2E tests.
- **Focus after sheets (react-native-web):** the modal returns the focus to its trigger when hiding – a focus on a moved
  element (Kanban) got lost, especially with animation. `Sheet` reports the end via `onHidden` (`Modal.onDismiss`), where
  the component sets the focus.
- **axe and names from several texts (RN web):** axe joins the visible parts of a button without spaces
  (“Team meeting09:00–10:00”) and did not find them in the button's own `aria-label` (`label-content-name-mismatch`).
  Events, Gantt rows, BarsList links and day headers therefore take their name from the visible text on the web
  (`contentName`); iOS/Android read the `aria-label`.
- **Scroll areas on the web:** horizontally scrolling tables, code and heatmaps need `tabIndex={0}` on the web, otherwise
  the keyboard cannot reach them (axe `scrollable-region-focusable`); loading/load-more rows sit below a `role="list"`,
  not inside it.
- **React Native – gestures and the React Compiler:** `PanResponder.create` in `useState` reads refs during render
  (`react-hooks/refs`). Toast swiping and the image viewer therefore use the responder props directly (like
  SignaturePad), with start points in refs from the handlers.
- **Empty form values:** TanStack forms often start select fields with `''`. Select (RN) treats `''` like no selection,
  otherwise the button would only say “Service” instead of “Service: Please select”.
