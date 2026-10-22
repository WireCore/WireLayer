import type { ClassValue } from 'tailwind-variants';
import type * as Recipes from './index.js';

// Own defaults and classes per part for the recipes – the base of RecipesProvider (all components below it) and of
// the `classes` prop (one component). Vue and React read both through useRecipe().

/** Any recipe of this package: slot recipes return an object of slot functions, the others a class string */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRecipe = (props?: any) => any;

type Variants<R extends AnyRecipe> = NonNullable<Parameters<R>[0]>;
/** Names of the parts of a recipe (`base`, `icon` …) */
export type RecipeSlot<R extends AnyRecipe> = ReturnType<R> extends string ? 'base' : keyof ReturnType<R> & string;
/** Extra classes per part, e.g. `{ base: 'rounded-none', icon: 'text-primary' }` */
export type RecipeClasses<R extends AnyRecipe> = Partial<Record<RecipeSlot<R>, ClassValue>>;

/** Defaults and classes for one recipe */
export interface RecipeOverride<R extends AnyRecipe = AnyRecipe> {
    /** Variants used when a component does not set them, e.g. `{ size: 'sm' }` */
    defaultVariants?: Partial<Omit<Variants<R>, 'class' | 'className'>>;
    classes?: RecipeClasses<R>;
}

/** Overrides by recipe name (the export name: `button`, `iconButton`, `dataTable` …) */
export type RecipeOverrides = Partial<Record<string, RecipeOverride>>;

type Exports = typeof Recipes;
/** Export names of the recipes (tv() results carry their variants) */
export type RecipeName = {
    [K in keyof Exports]: Exports[K] extends { variants: unknown; defaultVariants: unknown } ? K : never;
}[keyof Exports];
/** Typed overrides for RecipesProvider: variants and part names per recipe */
export type RecipeConfig = { [K in RecipeName]?: RecipeOverride<Extract<Exports[K], AnyRecipe>> };

/** Inner overrides win: defaults per variant, classes per part are joined (later ones win in tailwind-merge) */
export function mergeRecipeOverrides(outer: RecipeOverrides, inner: RecipeOverrides): RecipeOverrides {
    const merged: RecipeOverrides = { ...outer };
    for (const [name, override] of Object.entries(inner)) {
        const before = merged[name];
        if (!override) continue;
        merged[name] = before
            ? {
                  defaultVariants: { ...before.defaultVariants, ...override.defaultVariants },
                  classes: joinClasses(before.classes, override.classes),
              }
            : override;
    }
    return merged;
}

function joinClasses(
    first: Record<string, ClassValue> | undefined,
    second: Record<string, ClassValue> | undefined
): Record<string, ClassValue> | undefined {
    if (!first) return second;
    if (!second) return first;
    const joined: Record<string, ClassValue> = { ...first };
    for (const [slot, value] of Object.entries(second)) joined[slot] = [joined[slot], value];
    return joined;
}

/**
 * The recipe with the overrides applied, outer first: provider defaults fill the variants a component left open
 * (explicit values win), classes are added to their part before the class the component passes for it.
 */
export function withRecipeOverrides<R extends AnyRecipe>(recipe: R, overrides: (RecipeOverride | undefined)[]): R {
    const active = overrides.filter((override): override is RecipeOverride => !!override);
    if (active.length === 0) return recipe;
    const defaults = Object.assign({}, ...active.map((override) => override.defaultVariants));
    const classes = active.reduce<Record<string, ClassValue> | undefined>(
        (all, override) => joinClasses(all, override.classes as Record<string, ClassValue> | undefined),
        undefined
    );
    return ((props: Record<string, unknown> = {}) => {
        const given = Object.fromEntries(Object.entries(props).filter(([, value]) => value !== undefined));
        const variants = { ...defaults, ...given };
        if (!classes) return recipe(variants);
        const result = recipe(variants);
        // Recipes without parts: the classes join the class of the call
        if (typeof result === 'string') return recipe({ ...variants, class: [classes.base, given.class] });
        // Slot recipes: every part gets its classes before the class passed for it
        return Object.fromEntries(
            Object.entries(result as Record<string, (slotProps?: Record<string, unknown>) => string>).map(
                ([slot, part]) => [
                    slot,
                    classes[slot]
                        ? (slotProps: Record<string, unknown> = {}) =>
                              part({ ...slotProps, class: [classes[slot], slotProps.class] })
                        : part,
                ]
            )
        );
    }) as R;
}
