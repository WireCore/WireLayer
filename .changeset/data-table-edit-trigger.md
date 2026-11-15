---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

`DataTable editTrigger="dblclick"`: a double click starts editing a cell, a single click only focuses it – for tables
where a click should not open the editor by accident (e.g. while scanning or selecting text). The keyboard keeps
starting it right away (Enter or Space on the cell, Enter/F2 in the grid navigation). The default stays `click`.
