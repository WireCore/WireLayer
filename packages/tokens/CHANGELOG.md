# @wirecore/wirelayer-tokens

## 0.9.0

### Minor Changes

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

## 0.8.0

### Minor Changes

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

- efcb41e: `data-mode` and `data-theme` on a part of the page now set the text colour of that part as well. Body computes the text
  colour once from the page's mode and passes it down as a fixed value, so in a `data-mode="light"` part of a dark page
  text that inherits its colour (e.g. in a Card or a table) stayed light – light text on a white card – and the other way
  round. The rule sits in the base layer (`color: var(--wc-fg)`), so `text-*` classes still win; the part gets no
  background and may stay transparent. Overlays (Dialog, Drawer, Popover, Menu) already set their text colour and need no
  change; React Native switches mode and theme for the whole app.

## 0.7.0

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

## 0.6.0

### Minor Changes

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

### Patch Changes

- efd24f8: `parse` (and with it `resolveTokens` / `useResolvedTokens`) reads OKLCH colors with the lightness or chroma in
  percent, as minified CSS writes them (`oklch(47% .13 155)`). Before, the status colors resolved to `#NaNNaNNaN`.

## 0.5.1

### Patch Changes

- ad4939e: READMEs and the guide "Getting started": installation with npm, pnpm, Yarn and Bun (React Native: also
  `npx expo install`).

## 0.5.0

### Minor Changes

- 849eac6: Token colours as fixed values for canvas libraries (xterm.js, charts) that cannot read CSS variables:
  `resolveTokens(element?)` gives the colours that apply right now (mode, theme and own overrides) as hex – `#rrggbbaa` for
  the translucent ones – and `watchTokens(onChange)` reports a change of mode, theme or system colour scheme. The
  composable/hook `useResolvedTokens()` keeps them up to date.

### Patch Changes

- 849eac6: Popups with a positioner (Select, Combobox, Menu, Popover …) stay above a dialog: the theme gives Ark's positioners
  `z-index: var(--z-index)` (in the base layer). Ark sets the z-index inline, but Vue removed it again whenever the popup
  rendered anew – the list then lay behind the dialog, looked closed and the pointer hit the dialog.

## 0.4.0

### Minor Changes

- e7ecc8e: `suggestThemeFixes(theme)`: the pairs `checkTheme` reports, each with suggestions – the nearest variant of a colour of
  the pair that meets the contrast (lightness moved in OKLCH, hue kept, chroma only lowered where sRGB needs it) and, for
  text on a colour, a light or dark `on-*` colour; a suggestion never breaks a pair that passed. `checkTheme` stays as it
  is. Also new: `rgbToOklch`, `oklchToRgb`, `inGamut`, `toHex`.

### Patch Changes

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

## 0.3.0

### Minor Changes

- b46176b: One corner radius for all floating surfaces: the new token `--radius-popup` (12px, class `rounded-popup`) is used by
  Menu, ContextMenu, Menubar menus, the option lists of Select, MultiSelect, Combobox, Autocomplete, TagsInput, Mentions,
  CascadeSelect and TreeSelect, Popover, HoverCard, ConfirmPopup, Tour, DatePicker, ColorPicker, the DataTable filter
  panel, NavigationMenu, MegaMenu, FloatingPanel and the editor's bubble menu and mention list. Visible change: menus and
  option lists go from 10px to 12px (their items from 6px to 8px, so the corners stay concentric), the editor's menus
  from 8px to 12px; the panels already had 12px. Tooltip, Toast and Dialog keep their radius. A theme can set
  `--radius-popup` to change all of them at once.

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
