---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

DataTable: settings for the built-in cell editors, like `filterInputProps` for the filters.

- New column option `editInputProps` (type `DataTableEditInputOptions`): `number` editors take `min`, `max`, `step`,
  `allowDecimal` (false: whole numbers only) and `formatOptions` (e.g. a currency, with the numberInput feature);
  `select` editors `filter` (a search in the list) and `clearable` (a cleared choice is `null`); `multiSelect` editors
  `filter`, `clearable`, `maxShown` and `selectAll`; `placeholder` for all.
- `commit: 'confirm'` in `editInputProps` of a `select` editor: in the cell mode the choice only counts on Enter (on
  the closed field), Tab or leaving the cell, not right when it is picked – for columns where a slip of the mouse costs.
- `editable` also takes a function `(row) => boolean`: rows it answers false for get no editor at all (the cell shows
  its value, Tab skips it, pasting reports it as read-only), instead of rejecting the value in `validate`.
