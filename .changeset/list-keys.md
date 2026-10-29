---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

`Select` and `Combobox` report whether their list is open – Vue `v-model:open` / `update:open`, React
`open`/`onOpenChange` – and take `stopKeyPropagation` (default `false`): the keys the list handles itself (Enter choosing
or opening the list, Escape closing it, Tab leaving it) no longer bubble up, e.g. to a dialog that saves with Enter and
cancels with Escape on the window. Escape on a closed field still reaches the dialog.
