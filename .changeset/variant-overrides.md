---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

Recipe overrides per variant: `RecipesProvider` (and `useRecipe`) take `variants` – classes per part for single values
of a variant, e.g. `button: { variants: { size: { md: { base: 'h-[2.625rem]' } } } }` – and `compoundVariants` for
combinations (`{ size: ['sm', 'md'], shape: 'rounded', classes: { base: 'rounded-md' } }`). Names of variants, values and
parts are typed from the recipe like `defaultVariants`. Inner providers extend outer ones. Order per part: `classes`,
matching `variants` and `compoundVariants`, the states of the recipe, overrides of states, the own `class`. New types
`RecipeVariantClasses`, `RecipeCompoundClasses`, `RecipeVariantName`.
