---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

`Tabs` for panels that live elsewhere (editor or terminal tabs, panes shown with `v-show`):

- `TabsTrigger controls="pane-id"` points `aria-controls` at that element; `null` removes it (tabs without panels)
- `Tabs` takes `null` as its value: no tab selected. The first enabled tab then stays reachable with Tab (Ark takes
  every tab out of the Tab order without a selection); Tabs without a value stay as they were
