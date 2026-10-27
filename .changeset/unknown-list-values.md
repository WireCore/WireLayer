---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
---

Select, MultiSelect, VirtualSelect, Combobox and Listbox warn in development when a chosen value is not among their
items – it shows as raw text, e.g. `'DE'` with items that carry country names. They warn once the items are there: not
while loading, not without items, not with a data source (it resolves values later) and not for free text
(`allowCustomValue`). Nothing changes at runtime. New in `@wirecore/wirelayer-recipes`: `checkListValues()`; options
of such values carry `unknown: true`.
