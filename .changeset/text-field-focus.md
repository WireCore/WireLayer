---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

Focus API of the text fields. In Vue, `Input`, `PasswordInput`, `NumberInput`, `Textarea` and `MaskInput` expose
`focus(options?)`, `blur()`, `select()`, `setSelectionRange()` and the native input as `element` (type
`TextFieldHandle`) – a template ref is enough, no `ref.$el.querySelector('input')`. In React `ref` already reached the
native input of Input, PasswordInput, NumberInput and MaskInput; `Textarea` now passes it to the native textarea, too
(before, a `ref` was dropped). In a dialog, mark the field to start in with `data-autofocus` – the dialog moves the focus
after the content mounted, so a `focus()` in `onMounted` or an effect is overridden (story "Dialog › Initial focus").
