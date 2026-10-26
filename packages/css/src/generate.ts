// Turns the tailwind-variants recipes of @wirecore/wirelayer-recipes into plain CSS classes for HTML and server templates.
//
//   slot      → .wc-<recipe>[-<slot>]            e.g. .wc-button, .wc-button-icon, .wc-alert-icon-box
//   variant   → modifier .wc-<recipe>-<value>     e.g. .wc-button-danger, .wc-button-sm
//   boolean   → modifier .wc-<recipe>-<variant>   e.g. .wc-card-interactive, .wc-input-invalid
//
// A modifier applies to the element that carries it and to all slots inside it, so <button class="wc-button
// wc-button-sm"> sizes its icon as well. Default variants apply as long as no other value of that variant is set.
// Specificity mirrors tailwind-merge: slot (1 class) < variant (2) < compound variant (3+).
import { extendTailwindMerge } from 'tailwind-merge';

type ClassValue = string | null | undefined | false | ClassValue[];
type SlotClasses = Record<string, ClassValue>;

/** The parts of a tailwind-variants component this generator reads. */
export interface Recipe {
    base?: ClassValue;
    slots?: SlotClasses;
    variants?: Record<string, Record<string, ClassValue | SlotClasses>>;
    defaultVariants?: Record<string, unknown>;
    compoundVariants?: Array<Record<string, unknown>>;
    compoundSlots?: unknown[];
}

export interface Rule {
    selector: string;
    classes: string;
}

const kebab = (value: string) => value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
const flatten = (value: ClassValue): string[] =>
    Array.isArray(value) ? value.flatMap(flatten) : value ? value.split(/\s+/).filter(Boolean) : [];

/** Normalises a variant/compound value: a plain class list applies to the base slot. */
const perSlot = (value: ClassValue | SlotClasses): SlotClasses =>
    value && typeof value === 'object' && !Array.isArray(value) ? value : { base: value as ClassValue };

// Tailwind variants of a marker class (group/<name>) → the matching CSS pseudo-class
const groupStates: Record<string, string> = {
    first: ':first-child',
    last: ':last-child',
    even: ':nth-child(even)',
    odd: ':nth-child(odd)',
    hover: ':hover',
    focus: ':focus',
    'focus-visible': ':focus-visible',
    'focus-within': ':focus-within',
};

const isBoolean = (values: Record<string, unknown>) => Object.keys(values).every((v) => v === 'true' || v === 'false');

/** Class names of a recipe: a slot's class and the modifier of a variant value (the scheme at the top) */
function classNames(name: string, recipe: Recipe) {
    const prefix = `wc-${name}`;
    const variants = recipe.variants ?? {};
    return {
        slotClass: (slot: string) => (slot === 'base' ? prefix : `${prefix}-${kebab(slot)}`),
        modifier: (variant: string, value: string) =>
            isBoolean(variants[variant] ?? {}) ? `${prefix}-${kebab(variant)}` : `${prefix}-${kebab(value)}`,
    };
}

export function recipeRules(name: string, recipe: Recipe, merge: (classes: string) => string): Rule[] {
    const slots: SlotClasses = { ...recipe.slots };
    slots.base = [recipe.base, slots.base];
    const { slotClass, modifier } = classNames(name, recipe);
    if (recipe.compoundSlots?.length) throw new Error(`${name}: compoundSlots are not supported`);

    // Marker classes (group/item) cannot be applied – their group-*/item: variants are rewritten to
    // in-[.<slot class>:<state>]: so they refer to the slot class instead
    const markers = new Map<string, string>();
    for (const [slot, value] of Object.entries(slots)) {
        for (const cls of flatten(value)) {
            const marker = cls.match(/^group\/([\w-]+)$/)?.[1];
            if (marker) markers.set(marker, slotClass(slot));
            else if (cls === 'group' || cls.startsWith('peer')) throw new Error(`${name}: unsupported marker "${cls}"`);
        }
    }
    const prepare = (value: ClassValue) =>
        merge(
            flatten(value)
                .filter((cls) => !/^group\/[\w-]+$/.test(cls))
                .map((cls) =>
                    cls.replace(/group-([\w-]+|data-\[[^\]]+\])\/([\w-]+):/g, (_, state: string, marker: string) => {
                        // group-data-[state=selected]/row: and group-data-highlighted/item: → the attribute on the
                        // marked element
                        const pseudo = state.startsWith('data-[')
                            ? `[data-${state.slice(6)}`
                            : state.startsWith('data-')
                              ? `[${state}]`
                              : groupStates[state];
                        const target = markers.get(marker);
                        if (!pseudo || !target)
                            throw new Error(`${name}: unsupported variant group-${state}/${marker}`);
                        return `in-[.${target}${pseudo}]:`;
                    })
                )
                .join(' ')
        );

    const variants = recipe.variants ?? {};
    const within = (cls: string) => `.${cls}, .${cls} *`;

    // Condition (a pseudo-class) under which the classes of variant=value apply
    const condition = (variant: string, value: string): string => {
        const values = Object.keys(variants[variant] ?? {});
        if (isBoolean(variants[variant] ?? {})) {
            const set = within(modifier(variant, 'true'));
            return value === 'true' ? `:is(${set})` : `:not(${set})`;
        }
        if (String(recipe.defaultVariants?.[variant]) === value) {
            const others = values.filter((v) => v !== value).map((v) => within(modifier(variant, v)));
            return others.length ? `:not(${others.join(', ')})` : '';
        }
        return `:is(${within(modifier(variant, value))})`;
    };

    // Modifier names must not collide with each other or with slot classes
    const names = new Set(Object.keys(slots).map(slotClass));
    for (const [variant, values] of Object.entries(variants)) {
        for (const value of new Set(Object.keys(values).map((v) => modifier(variant, v)))) {
            if (names.has(value)) throw new Error(`${name}: class name ${value} is used twice`);
            names.add(value);
        }
    }

    const rules: Rule[] = [];
    const add = (classes: SlotClasses, suffix: string) => {
        for (const [slot, value] of Object.entries(classes)) {
            const merged = prepare(value);
            if (merged) rules.push({ selector: `.${slotClass(slot)}${suffix}`, classes: merged });
        }
    };

    add(slots, '');
    for (const [variant, values] of Object.entries(variants)) {
        for (const [value, classes] of Object.entries(values)) add(perSlot(classes), condition(variant, value));
    }
    for (const { class: cls, className, ...when } of recipe.compoundVariants ?? []) {
        const suffix = Object.entries(when)
            .map(([variant, value]) =>
                Array.isArray(value)
                    ? `:is(${value.map((v) => condition(variant, String(v)) || '*').join(', ')})`
                    : condition(variant, String(value))
            )
            .join('');
        add(perSlot((cls ?? className) as ClassValue | SlotClasses), suffix);
    }
    return rules;
}

/** Recipes without a meaning in static HTML */
export const skipped = ['virtualList'];

/** CSS names that differ from the recipe export */
const cssNames: Record<string, string> = { switchControl: 'switch' };

const isRecipe = (value: unknown): value is Recipe =>
    typeof value === 'function' && 'variantKeys' in value && 'slots' in value;

const recipesOf = (module: Record<string, unknown>) =>
    Object.entries(module).filter(
        (entry): entry is [string, Recipe] => isRecipe(entry[1]) && !skipped.includes(entry[0])
    );

/** The classes of every recipe for the docs (llms.txt): root class, parts and the modifier of each variant value */
export function classReference(module: Record<string, unknown>) {
    return recipesOf(module).map(([exportName, recipe]) => {
        const name = cssNames[exportName] ?? kebab(exportName);
        const { slotClass, modifier } = classNames(name, recipe);
        return {
            name,
            base: slotClass('base'),
            slots: Object.keys(recipe.slots ?? {})
                .filter((slot) => slot !== 'base')
                .map((slot) => ({ slot, class: slotClass(slot) })),
            variants: Object.entries(recipe.variants ?? {}).map(([variant, values]) => ({
                variant,
                // An on/off variant has one class (for `true`)
                values: (isBoolean(values) ? ['true'] : Object.keys(values)).map((value) => ({
                    value,
                    class: modifier(variant, value),
                    default: String(recipe.defaultVariants?.[variant]) === value,
                })),
            })),
        };
    });
}

/** All recipes of a module (e.g. `import * as recipes from '@wirecore/wirelayer-recipes'`) as CSS with @apply. */
export function generate(module: Record<string, unknown>, mergeConfig: Parameters<typeof extendTailwindMerge>[0]) {
    const merge = extendTailwindMerge(mergeConfig);
    const blocks = recipesOf(module).map(([exportName, recipe]) => {
        const name = cssNames[exportName] ?? kebab(exportName);
        const rules = recipeRules(name, recipe, merge);
        const css = `/* ${name} */\n${rules.map((r) => `${r.selector} {\n    @apply ${r.classes};\n}`).join('\n')}`;
        return { name, rules, css };
    });
    const css = blocks.map((block) => block.css).join('\n\n');
    return { css: `@layer components {\n${css}\n}\n`, blocks };
}
