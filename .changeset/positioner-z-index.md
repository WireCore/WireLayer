---
'@wirecore/wirelayer-tokens': patch
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
---

Popups with a positioner (Select, Combobox, Menu, Popover …) stay above a dialog: the theme gives Ark's positioners
`z-index: var(--z-index)` (in the base layer). Ark sets the z-index inline, but Vue removed it again whenever the popup
rendered anew – the list then lay behind the dialog, looked closed and the pointer hit the dialog.
