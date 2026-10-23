---
'@wirecore/wirelayer-vue': patch
---

`bindInput` from `/form` fits `Input` and `Textarea` in compiled SFC templates: `onUpdate:modelValue` accepts
`string | undefined` (what the components emit) and `modelValue` falls back to `''`, like the React variant. Before,
`<Input v-bind="bindInput(field)" />` was a vue-tsc error.
