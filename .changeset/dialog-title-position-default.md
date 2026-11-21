---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

Dialog: the title position can be set once for the whole app. `DialogContent` reads `titleInHeader` from the
`defaultVariants` of the `dialog` recipe (RecipesProvider/ConfigProvider `recipes`) when `titlePosition` is not set –
`{ dialog: { defaultVariants: { titleInHeader: true } } }` puts the title of every dialog next to the close button; the
prop on a single dialog still wins.

- `ConfirmDialog` (`confirm()`, `prompt()`) and `DialogHost` (`openDialog()`) follow the same default; their requests
  take the new option `titlePosition`, which wins over it. Before, the default only changed their classes, not where the
  title is.
- New `useRecipeDefaults(name, recipe)`: the default variants of a recipe with those of the nearest RecipesProvider –
  for own components whose markup depends on a variant.
- Docs: _Customizing_ lists the recipe defaults that change more than classes; the PrimeVue migration guide shows the
  central setting. React Native has no RecipesProvider, the prop stays on the single dialog there.
