---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

Menus for desktop apps, all opt-in:

- `ContextMenu` reports its open state (Vue `v-model:open` / `update:open`, React `open`/`onOpenChange`) – e.g. to keep
  Delete, Enter or F2 from the list below while it is open – and `before-open` / `onBeforeOpen` with the right-clicked
  (or long-pressed) element, to select its row before the menu shows
- `Menu` and `ContextMenu` take `closeOnScroll`, `closeOnResize` and `closeOnBlur` (default `false`): a menu at a point
  closes when the content below scrolls (not a scroll inside the menu), the window is resized or loses the focus
- `highlightFirst` on both: the first item is highlighted also when the menu opens by pointer, so Enter takes it
- `closeMenuOnPageEvents` in the recipes
