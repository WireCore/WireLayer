---
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
---

`Calendar` and `DatePicker` with `allowDeselect`: clearing the chosen day keeps its month in view and the focus on that
day. Before, the view jumped to today's month.
