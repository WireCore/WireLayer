---
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
---

DataTable filters: `filterInputProps` takes `selectAll` (multiSelect filters: an entry that selects all choices, as on
MultiSelect) and `formatOptions` (number filters with the numberInput feature, e.g.
`{ style: 'currency', currency: 'EUR' }`). The list of a multiSelect filter in the filter row no longer starts with an
"All" choice – the empty field already shows "All", and "Select all" would have chosen it as well.
