---
'@wirecore/wirelayer-recipes': minor
---

Classes from `RecipesProvider` or `classes` no longer hide states. A provider with `input: { classes: { base:
'border-line-2' } }` replaced the red border of an invalid field (tailwind-merge let the later class win). The classes
of an active state variant – `invalid`, `success`, `disabled`, `readOnly`, `current`, `selected`, `checked`, `loading`,
also in compound variants – now come after the override classes of their part. The class passed to the component itself
(`class`/`className`) still comes last and wins over everything. Without overrides nothing changes.
