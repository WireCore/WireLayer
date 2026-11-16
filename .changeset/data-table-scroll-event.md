---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

DataTable: `scroll` (Vue) / `onScroll` (React) reports every scroll of the table's scroll area – down and up with
`scrollHeight` (also with `virtual`), sideways when the table is wider – e.g. to close a popover anchored in a row that
virtual scrolling removes. `loadMore` stays as it was. In React `onScroll` was passed to the outer element before, where
it never fired (that element does not scroll).
