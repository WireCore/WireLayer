---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

`Select` with `emptyValue`, e.g. `""` for a model that uses an empty string for "nothing chosen": the value counts as
null – the placeholder shows, no development warning about an unknown value – and clearing gives it back instead of null
(typed `V | E`). Without it `""` is still an unknown value shown as text.
