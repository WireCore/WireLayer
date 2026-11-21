---
'@wirecore/wirelayer-recipes': patch
'@wirecore/wirelayer-css': patch
---

Checkbox, Radio, Switch and the other controls with a hidden native input no longer stretch the page or make a dialog
jump. Ark's hidden input is absolutely positioned (1px, visually hidden), and the part around it was not positioned, so
the input was placed against the page: a scrolling area (DataTable with `scrollHeight`, the body of a Dialog with
`scrollBehavior="inside"`) did not clip it. A DataTable with `selectable` left an invisible point per rendered row below
its scroll area – the page got a long empty end and, with `virtual`, grew while the rows scrolled; in a dialog, focusing
a checkbox further down scrolled the positioner instead of the body, so header and close button left the screen.

- `relative` on the part around the hidden input: `checkbox` base, `radioGroup` item, `switchControl` base,
  `segmentedControl` item, the base of `select`, `multiSelect`, `pinInput`, `colorPicker` and `fileUpload`
  (`selectionCard` and `colorSwatchPicker` had it already).
- `relative` on the scroll area of the DataTable, so absolutely positioned content of own cells stays inside as well.
