---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-native': minor
---

Choices that cannot be empty give their value type without the empty value – no `$event && …` guard for a model that
is never empty. Only the types change, unless noted:

- `RadioGroup` and `SegmentedControl` with `required`: v-model / `onValueChange` get `V`, not `V | null`. A form reset
  back to an empty start (the only way Ark empties the group) is no longer passed on for a required group.
  `SegmentedControl` takes `required` now (`aria-required` on the group); React Native's `RadioGroup` is typed the same
- `NativeSelect` without `placeholder`: `V`, not `V | ''` (only the placeholder option gives `''`)
