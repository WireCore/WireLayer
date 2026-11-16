---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-native': minor
---

Tour:

- `step` (Vue `v-model:step`, React/React Native `step` + `onStepChange`) shows the id of the current step and moves
  the tour there when set; `null` while it does not run.
- `TourStep.before` runs before a step is shown (also for the first one and when going back) and may be async, e.g. to
  switch a tab; `TourStep.waitFor` waits up to that many ms for the target afterwards (it may still load). Meanwhile
  the previous step stays, busy (`aria-busy`, Back/Next disabled).
- `missingTarget`: a step whose target is not there is skipped (default, in the direction the tour moves) or shown as a
  centred dialog (`'dialog'`). Before, the whole tour ended after 3 s without a word – `open` stayed `true`.
- Steps passed after the tour was created (e.g. set right before opening it) are taken; `complete` is reported once.

Sortable:

- `clone` makes a list a source (e.g. a palette): its items are copied out – the function makes the copy, e.g. with a
  new id – it keeps them, takes none in and is not sorted. By keyboard (Space, arrows into a list, Space; Escape takes
  the copy back), pointer, two clicks and on React Native the screen reader action "Copy to “…”"; announced.
- Nested lists (a list inside an item of another list of the group): the pointer over a nested list – also its empty
  area – puts the item there, not into the outer list; an item no longer goes into a list inside itself; a click in a
  nested list that does not take the item leaves the outer list alone.
