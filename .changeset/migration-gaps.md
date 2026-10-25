---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-css': minor
'@wirecore/wirelayer-mcp': minor
'@wirecore/wirelayer-native': patch
---

Closes gaps found when moving an app from PrimeVue.

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
