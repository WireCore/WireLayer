---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

DataTable: sorting by several columns can be set once for the whole app. The `dataTable` recipe gets a variant
`multiSort` without classes of its own – `{ dataTable: { defaultVariants: { multiSort: true } } }` in the
RecipesProvider/ConfigProvider lets Shift+click (and the column menu) sort every table by further columns, as
`sortMode="multiple"` did on a single table; `sortMode` on a table still wins. As in the multiple mode, `sorting`
(`v-model:sorting`, `onSortingChange`) is then an array.
