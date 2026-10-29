---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

`NumberInput` with `emptyFallback`, for fields that always need a number (e.g. a port): an emptied field keeps its value
while it is empty and falls back to `min` (or 0) or to the last valid number (`previous`) when it is left or Enter is
pressed. v-model / `onValueChange` is then typed `number`. Without it an emptied field still reports null.

Note for type code around the components: `NumberInput` (Vue) is generic now, so `InstanceType<typeof NumberInput>` and
Storybook's `Meta<typeof NumberInput>` need a cast (as for Select).
