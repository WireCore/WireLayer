---
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
---

DataTable `defaultSorting` (and a controlled `sorting`) now also sorts by a column without `sortable`. TanStack applied
a sorting only to columns the user can sort and dropped the others without a word – the table showed the rows unsorted.
The column still has no sort button and no sort entries in its menu; its header announces the order (`aria-sort`).
