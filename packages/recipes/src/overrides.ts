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
/** Names of the variants of a recipe (`size`, `invalid` …) */
export type RecipeVariantName<R extends AnyRecipe> = Exclude<keyof Variants<R>, 'class' | 'className'> & string;
/** The values of a variant as the recipe writes them: `'sm' | 'md'`, `'true' | 'false'` for a flag */
type ValueKey<V> = V extends boolean ? 'true' | 'false' : V extends string | number ? `${V}` : never;
/** Extra classes per part for single values of a variant, e.g. `{ size: { md: { base: 'h-11' } } }` */
export type RecipeVariantClasses<R extends AnyRecipe> = {
    [K in RecipeVariantName<R>]?: { [V in ValueKey<NonNullable<Variants<R>[K]>>]?: RecipeClasses<R> };
};
/** Extra classes per part when all the given variants match, e.g. `{ size: 'md', shape: 'rounded', classes: … }` */
export type RecipeCompoundClasses<R extends AnyRecipe> = {
    [K in RecipeVariantName<R>]?: NonNullable<Variants<R>[K]> | NonNullable<Variants<R>[K]>[];
} & { classes: RecipeClasses<R> };

/** Defaults and classes for one recipe */
export interface RecipeOverride<R extends AnyRecipe = AnyRecipe> {
    /** Variants used when a component does not set them, e.g. `{ size: 'sm' }` */
    defaultVariants?: Partial<Omit<Variants<R>, 'class' | 'className'>>;
    classes?: RecipeClasses<R>;
    /** Classes per part for single values of a variant, e.g. `{ size: { md: { base: 'h-11' } } }` */
    variants?: RecipeVariantClasses<R>;
    /** Classes per part for combinations of variants, e.g. `[{ size: 'md', shape: 'rounded', classes: … }]` */
    compoundVariants?: RecipeCompoundClasses<R>[];
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

/**
 * Inner overrides win: defaults per variant, classes per part (also per variant value) are joined and compound
 * variants appended – later ones win in tailwind-merge
 */
export function mergeRecipeOverrides(outer: RecipeOverrides, inner: RecipeOverrides): RecipeOverrides {
    const merged: RecipeOverrides = { ...outer };
    for (const [name, override] of Object.entries(inner)) {
        const before = merged[name];
        if (!override) continue;
        merged[name] = before
            ? {
                  defaultVariants: { ...before.defaultVariants, ...override.defaultVariants },
                  classes: joinClasses(before.classes, override.classes),
                  variants: joinVariants(before.variants, override.variants),
                  compoundVariants: [...(before.compoundVariants ?? []), ...(override.compoundVariants ?? [])],
              }
            : override;
    }
    return merged;
}

type VariantClasses = Record<string, Record<string, Record<string, ClassValue> | undefined> | undefined>;

function joinVariants(first: VariantClasses | undefined, second: VariantClasses | undefined) {
    if (!first) return second;
    if (!second) return first;
    const joined: VariantClasses = { ...first };
    for (const [variant, values] of Object.entries(second)) {
        const all = { ...joined[variant] };
        for (const [value, classes] of Object.entries(values ?? {})) all[value] = joinClasses(all[value], classes);
        joined[variant] = all;
    }
    return joined;
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
 * Variants that are states: with classes for a part, the classes of an active state are added again after them – a
 * changed border keeps the red of an invalid field. The class passed to the part comes last and still wins.
 */
const STATE_VARIANTS = new Set([
    'invalid',
    'success',
    'disabled',
    'readOnly',
    'current',
    'selected',
    'checked',
    'loading',
]);

type PartClasses = Record<string, ClassValue[]>;
/** A recipe (tv: `class` per value, a string for the base part) or an override (`classes` per part) */
interface VariantSource {
    classes?: Record<string, ClassValue>;
    variants?: Record<string, Record<string, unknown> | undefined>;
    compoundVariants?: Record<string, unknown>[];
    defaultVariants?: Record<string, unknown>;
}

/** Adds classes of a variant (a class value for the base part or classes per part) */
function addClasses(into: PartClasses, value: unknown) {
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'string' || Array.isArray(value)) (into.base ??= []).push(value as ClassValue);
    else
        for (const [slot, classes] of Object.entries(value as Record<string, ClassValue>))
            (into[slot] ??= []).push(classes);
}

const matches = (value: unknown, condition: unknown) =>
    Array.isArray(condition)
        ? condition.some((item) => String(item) === String(value))
        : String(condition) === String(value);

/**
 * Adds the classes of the matching variant values and compound variants of `source` – either those of states (a state
 * variant, or a compound variant with one) or all others
 */
function addMatching(into: PartClasses, source: VariantSource, active: Record<string, unknown>, states: boolean) {
    for (const [name, values] of Object.entries(source.variants ?? {})) {
        if (STATE_VARIANTS.has(name) === states && active[name] !== undefined)
            addClasses(into, values?.[String(active[name])]);
    }
    for (const { class: value, className, classes, ...conditions } of source.compoundVariants ?? []) {
        const names = Object.keys(conditions);
        if (names.some((name) => STATE_VARIANTS.has(name)) !== states) continue;
        if (names.every((name) => matches(active[name], conditions[name])))
            addClasses(into, classes ?? value ?? className);
    }
    return into;
}

const defined = (props: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(props).filter(([, value]) => value !== undefined));

/**
 * The recipe with the overrides applied, outer first: provider defaults fill the variants a component left open
 * (explicit values win). Each part then gets, in this order: the override classes, the override classes of matching
 * variant values and compound variants, the classes of the active states (see STATE_VARIANTS), the override classes
 * of those states – and last the class the component passes for it.
 */
export function withRecipeOverrides<R extends AnyRecipe>(recipe: R, overrides: (RecipeOverride | undefined)[]): R {
    const active = overrides.filter((override): override is RecipeOverride => !!override) as VariantSource[];
    if (active.length === 0) return recipe;
    const defaults = Object.assign({}, ...active.map((override) => override.defaultVariants));
    const styled = active.some((override) => override.classes || override.variants || override.compoundVariants);
    const own = recipe as unknown as VariantSource;
    /** Classes for the parts with the given variants: undefined for a part without overrides */
    const partClasses = (variants: Record<string, unknown>) => {
        const current = { ...own.defaultVariants, ...variants };
        const look: PartClasses = {};
        const states: PartClasses = {};
        for (const override of active) {
            addClasses(look, override.classes);
            addMatching(look, override, current, false);
        }
        for (const override of active) addMatching(states, override, current, true);
        const recipeStates = addMatching({}, own, current, true);
        return (slot: string) =>
            look[slot] || states[slot] ? [look[slot], recipeStates[slot], states[slot]] : undefined;
    };
    return ((props: Record<string, unknown> = {}) => {
        const given = defined(props);
        const variants = { ...defaults, ...given };
        if (!styled) return recipe(variants);
        const result = recipe(variants);
        // Recipes without parts: the classes join the class of the call
        if (typeof result === 'string') {
            const classes = partClasses(variants)('base');
            return classes ? recipe({ ...variants, class: [classes, given.class] }) : result;
        }
        // Slot recipes: the parts with overrides get them (with variants passed to the part as well)
        const forCall = partClasses(variants);
        return Object.fromEntries(
            Object.entries(result as Record<string, (slotProps?: Record<string, unknown>) => string>).map(
                ([slot, part]) => [
                    slot,
                    (slotProps: Record<string, unknown> = {}) => {
                        const passed = defined(slotProps);
                        const classes = Object.keys(passed).some((key) => key !== 'class' && key !== 'className')
                            ? partClasses({ ...variants, ...passed })(slot)
                            : forCall(slot);
                        return classes ? part({ ...slotProps, class: [classes, slotProps.class] }) : part(slotProps);
                    },
                ]
            )
        );
    }) as R;
}
