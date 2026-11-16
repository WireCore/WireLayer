---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

DataTable: own content of a footer cell – the slot `#footer-<id>` (Vue) or the column option `renderFooter` (React)
gets `value` (the total of `aggregate`, not formatted), `text` (what the cell shows by default) and `rows` (the filtered
rows the total is computed from, every page, without group rows), e.g. for totals as badges. A column with only own
footer content shows the footer row as well; the CSV export and printing keep the text.
