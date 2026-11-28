---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

DataTable: `exportRows="leaves"` – the CSV, Excel and print of a TreeTable (`getSubRows`) only have the rows without
children, e.g. when a parent only sums up its children ("Person – 2 licences" above the licences); still filtered and
sorted like the table (with `treeFilterMode="lenient"` only the leaves that match themselves). The methods take it as
option `rows` (`generateCsv({ rows: 'leaves' })`, also `generateXlsx`, `exportCsv`, `exportXlsx`, `print`), which wins
over the prop; `selectionOnly` is not affected. Default `all`, as before. Story _Tree export_.
