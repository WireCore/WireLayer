---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-css': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

DataTable: new prop `sortable` for the whole table – every column with a value can be sorted unless it sets
`sortable: false`; columns without a value of their own (no field in the rows, no `accessor` or `sortFn`, e.g. a column
of action buttons) stay out. As a classless variant of the `dataTable` recipe it can be set for the whole app:
`{ dataTable: { defaultVariants: { sortable: true } } }`, the prop on a table and `sortable` on a column win.
