---
'@wirecore/wirelayer-recipes': patch
'@wirecore/wirelayer-css': patch
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
---

DataTable `resizable`: the resize handle of the last column no longer sticks out of the table. Every handle lies half
over the border to the next column; the last one has none, so it reached 4px past the table – a table whose columns fit
exactly scrolled a little sideways, and its line stood after the last column (next to the scrollbar with
`scrollHeight`). The handle of the column that ends the table (also after hiding, reordering or pinning columns; not when
the action column follows) now lies inside it, without the line at rest (new variant `edge` of the `resizer` part);
mouse, touch and keyboard still resize it.
