---
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
---

`Stepper` and `Wizard`: while the current step is busy – an async `validate` in the `Wizard`, `loading` on the item in
the `Stepper` – "Next" shows a spinner and ignores clicks (`aria-busy`, `aria-disabled`) but keeps the focus. Before,
only the step's number turned into a spinner, and a second click on the unchanged button looked like nothing happened.
