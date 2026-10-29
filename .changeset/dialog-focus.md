---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

Focus for dialogs and wizards whose content changes:

- `data-autoselect` on a field in a `Dialog`: it gets the focus when the dialog opens, with its text selected (e.g. a
  prefilled name). Without it Ark's choice stays (an alertdialog's close button, `data-autofocus`, the first element)
- `focusFirst(container)` (also from the component packages) focuses like opening does – `data-autoselect`,
  `data-autofocus`/`autofocus`, otherwise the first field; Vue's `DialogContent` exposes it as `focusFirst()`
- `Wizard focusOnStepChange` moves the focus into each new step the same way (not after a failed check: the invalid
  field keeps it)
- `autoselectElement(content)` in the recipes for a dialog's own initial focus
