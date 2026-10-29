---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

`ContextMenu`'s `before-open` / `onBeforeOpen` gets a second argument `{ source: 'pointer' | 'keyboard', focused }`:
opened with Shift+F10 or the menu key, `focused` is the element with the focus – a list can tell a row from its empty
space even when the browser fires the event on the whole area. The first argument stays as it was.
`createContextMenuSource()` in the recipes tells the two apart.
