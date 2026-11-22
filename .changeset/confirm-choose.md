---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-native': minor
---

New `choose()` next to `confirm()`: it asks the same way in the app-wide `ConfirmDialog` but tells the buttons from
closing – it resolves with `'confirm'`, `'cancel'` (the cancel button) or `'dismiss'` (Escape, the close button, the
back button on Android, a newer request). For dialogs whose second button is an action of its own ("No, assign by
hand", "Discard"), where closing should do nothing. `confirm()` and `prompt()` stay as they are; new type
`ConfirmChoice`. Story _Choose_ in every Storybook; the PrimeVue migration guide names it under _Pitfalls_.
