---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-blocks-vue': patch
'@wirecore/wirelayer-blocks-react': patch
---

Collection props take read-only arrays (`readonly T[]`), like Select already did: DataTable `data` and `columns`, the
`items` of Menu, Tree, Steps, Breadcrumb, Timeline, Carousel and the other list components, chart `data` and `series`,
Menubar `menus`, Scheduler `events` and many more – data from an API client no longer has to be copied. Props that are
written back (`v-model:*` / `on…Change`, e.g. `modelValue`, `selectedValue`, Kanban `columns`) and the nested
`children` of trees and column groups stay mutable. The recipe helpers that read such lists (Gantt, scheduler,
notifications, `rankItems`, `filterMenuEntries`, `withLoadedChildren`, …) take read-only arrays as well.
