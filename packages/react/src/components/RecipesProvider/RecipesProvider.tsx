import {
    checkRecipeSources,
    mergeRecipeOverrides,
    withRecipeOverrides,
    type AnyRecipe,
    type RecipeClasses,
    type RecipeConfig,
    type RecipeOverrides,
} from '@wirecore/wirelayer-recipes';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

const RecipesContext = createContext<RecipeOverrides>({});

export interface RecipesProviderProps {
    /**
     * Defaults and classes per recipe for every component below, e.g.
     * `{ button: { defaultVariants: { size: 'sm' }, classes: { base: 'rounded-md' } } }`
     */
    recipes: RecipeConfig;
    children?: ReactNode;
}

/** Own defaults and classes per part for the components below (inner providers win) */
export function RecipesProvider({ recipes, children }: RecipesProviderProps) {
    const parent = useContext(RecipesContext);
    const value = useMemo(() => mergeRecipeOverrides(parent, recipes as RecipeOverrides), [parent, recipes]);
    return <RecipesContext value={value}>{children}</RecipesContext>;
}

/** The recipe with the defaults and classes of the nearest RecipesProvider and the component's `classes` prop */
export function useRecipe<R extends AnyRecipe>(name: string, recipe: R, classes?: RecipeClasses<R>): R {
    const provided = useContext(RecipesContext);
    checkRecipeSources(name);
    return withRecipeOverrides(recipe, [provided[name], classes ? { classes } : undefined]);
}

/**
 * The default variants of a recipe – its own, overridden by the nearest RecipesProvider. For props that change the
 * markup as well as the classes (DialogContent `titlePosition` ↔ `titleInHeader`, DataTable `showFilters` …): the
 * component reads the default here when the prop is not set.
 */
export function useRecipeDefaults<R extends AnyRecipe>(
    name: string,
    recipe: R
): Partial<Omit<NonNullable<Parameters<R>[0]>, 'class' | 'className'>> {
    const provided = useContext(RecipesContext);
    const own = (recipe as { defaultVariants?: Record<string, unknown> }).defaultVariants;
    return { ...own, ...provided[name]?.defaultVariants } as Partial<
        Omit<NonNullable<Parameters<R>[0]>, 'class' | 'className'>
    >;
}
