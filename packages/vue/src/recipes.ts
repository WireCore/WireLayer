import {
    mergeRecipeOverrides,
    withRecipeOverrides,
    type AnyRecipe,
    type RecipeClasses,
    type RecipeOverrides,
} from '@wirecore/wirelayer-recipes';
import { computed, inject, provide, type ComputedRef, type InjectionKey } from 'vue';

const key: InjectionKey<ComputedRef<RecipeOverrides>> = Symbol('wirecore-recipes');

/** Adds overrides for the components below (inner ones win) – used by RecipesProvider */
export function provideRecipes(overrides: () => RecipeOverrides) {
    const parent = inject(key, null);
    provide(
        key,
        computed(() => mergeRecipeOverrides(parent?.value ?? {}, overrides()))
    );
}

/**
 * The recipe with the defaults and classes of the nearest RecipesProvider and the component's `classes` prop.
 * Call it in setup; it reads both on every call, so a computed or render that calls it follows changes.
 */
export function useRecipe<R extends AnyRecipe>(
    name: string,
    recipe: R,
    classes?: () => RecipeClasses<R> | undefined
): R {
    const provided = inject(key, null);
    return ((props?: Record<string, unknown>) =>
        withRecipeOverrides(recipe, [provided?.value[name], classes ? { classes: classes() } : undefined])(props)) as R;
}
