---
'@wirecore/wirelayer-recipes': patch
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
---

Dialog: when it opens, `data-autofocus` and `autofocus` are resolved like `data-autoselect` and `focusFirst()` – also on
a wrapper such as a component's root, which then gives the focus to its first field (e.g. `<Listbox filter
data-autofocus>` focuses its search field). Ark skipped such a wrapper and focused the close button. Story _Initial
focus on a component_.
