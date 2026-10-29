import * as Recipes from './index.js';
import type { RecipeOverrides } from './overrides.js';

/** Recipes whose `size` is the density of a surface, not the size of a control – a small Card stays opt-in */
const densities = new Set(['card', 'cardParts']);

/**
 * Default `size` for every recipe that has that size (ConfigProvider `size`): `sizeOverrides('sm')` makes buttons,
 * inputs, selects … small unless a component sets its own size. Recipes without the size are left alone.
 */
export function sizeOverrides(size: string): RecipeOverrides {
    const overrides: RecipeOverrides = {};
    for (const [name, recipe] of Object.entries(Recipes)) {
        if (densities.has(name)) continue;
        const sizes = (recipe as { variants?: { size?: Record<string, unknown> } } | null)?.variants?.size;
        if (typeof recipe === 'function' && sizes && Object.hasOwn(sizes, size))
            overrides[name] = { defaultVariants: { size } };
    }
    return overrides;
}
