---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-css': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

DataTable `searchAlign="center"` (recipe variant `searchCentered`) puts the search in the middle of the toolbar. It used
to centre the field in the free room between the start and the end group – without controls at the start and with a
wide end group (refresh, print, filters, columns) it sat clearly left of the middle.

- The start group (also when empty) and the end group share the room on both sides equally, so the search is centred
  in the toolbar however wide the tools at the end are. A group wider than its half moves the search aside instead of
  overflowing; when they do not fit next to it the toolbar wraps.
- Narrow toolbars (container query, below 42rem): the search starts the row, wrapped onto a row of its own it is
  centred, the tools follow at the end.
- With `searchAlign="center"` own `toolbar` controls join the end group (before the built-in buttons) and own
  `toolbarStart` controls form one group – `searchAlign="start"` renders the toolbar as before.
- Story “Search in the middle, nothing at the start”.
