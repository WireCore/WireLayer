---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

DataTable `rowExpandable` (Vue `row-expandable`): `(row) => boolean` decides which rows have details (`expansion`). Rows
without details get no expand button – their cell keeps its width, the columns stay aligned – and "Expand all" opens
only the rows that have details. Without the prop every row can be expanded, as before.
