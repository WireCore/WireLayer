---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-native': minor
---

ConfirmDialog: `confirmButton` and `cancelButton` (Vue `confirm-button`, `cancel-button`) set the look of its buttons
for every request – `{ variant, color, size, shape }` as on Button; the same options in `confirm()` and `prompt()` win
for one request. The defaults stay: size sm, cancel `outline`, confirm `primary` (`danger` with status danger). New
type `ConfirmButtonOptions`.
