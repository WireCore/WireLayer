---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-css': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

DataTable: new prop `searchAlign` (`start` – default, as before – or `center`). With `center` the search field sits in the
middle between your own controls at the start of the toolbar and the controls at the end, with the same room on both
sides; without controls at the start it is centred in the free room, the end group stays at the end, and on narrow
screens the toolbar wraps as before. A variant of the `dataTable` recipe, so it can be set for the whole app:
`{ dataTable: { defaultVariants: { searchAlign: 'center' } } }` (only tables with `search` change). Story “Search in the
middle”.
