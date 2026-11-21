---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-css': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

DataTable: defaults for the whole app instead of on every table – all through the `defaultVariants` of the `dataTable`
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
