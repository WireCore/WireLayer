---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

`FormField` passes `classes` on to its Field – e.g. `{ label: 'text-sm' }` – like every other component; before, the
label could only be changed through the label slot. React's `FormField` also takes `className` now (Vue passed `class`
through already).
