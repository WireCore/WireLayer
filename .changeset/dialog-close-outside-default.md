---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

Dialog and Drawer: whether a click outside closes them can be set once for the whole app. The `dialog` and `drawer`
recipes get a variant `closeOnInteractOutside` without classes of its own – `{ dialog: { defaultVariants: {
closeOnInteractOutside: false } }, drawer: { defaultVariants: { closeOnInteractOutside: false } } }` in the
RecipesProvider/ConfigProvider keeps every modal dialog and drawer open on a click outside (no lost input in form
dialogs); the prop on a single `Dialog` or `Drawer` still wins.

- `openDialog()` follows the default of the `dialog` recipe; its option `closeOnInteractOutside` wins over it.
- `confirm()` and `prompt()` are alertdialogs and never close on a click outside – unchanged.
- Docs: _Customizing_ lists the new default, the PrimeVue migration guide names it under _Pitfalls_. React Native has no
  RecipesProvider, the prop stays on the single dialog there.
