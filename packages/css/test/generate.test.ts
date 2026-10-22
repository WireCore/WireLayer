import { readFileSync } from 'node:fs';
import * as recipes from '@wirecore/wirelayer-recipes';
import { describe, expect, it } from 'vitest';
import { generate, skipped, type Recipe } from '../src/generate.ts';

const { css, blocks } = generate(recipes, recipes.twMergeConfig);
const compiled = readFileSync(new URL('../dist/wirecore.css', import.meta.url), 'utf8');
const exported = Object.entries(recipes).filter(([, value]) => typeof value === 'function' && 'variantKeys' in value);
/** Default values without classes (e.g. size md: {}) need no default rule */
const hasClasses = (value: unknown): boolean =>
    typeof value === 'string'
        ? value.trim() !== ''
        : Array.isArray(value)
          ? value.some(hasClasses)
          : !!value && typeof value === 'object' && Object.values(value).some(hasClasses);
const kebab = (value: string) => value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

describe('@wirecore/wirelayer-css', () => {
    it('covers every recipe (or skips it explicitly)', () => {
        const generated = blocks.length + skipped.length;
        expect(generated).toBe(exported.length);
    });

    // Every slot and every variant value of every recipe ends up in the compiled CSS. Default values have no
    // class of their own – they apply as long as no other value is set (`:not(...)`), so writing them is optional.
    it.each(blocks.map((block) => [block.name, block] as const))('%s: all slots and variants', (name) => {
        const [, recipe] = exported.find(([key]) => (key === 'switchControl' ? 'switch' : kebab(key)) === name)! as [
            string,
            Recipe,
        ];
        const expected = new Set<string>();
        for (const slot of Object.keys({ base: 1, ...recipe.slots }))
            expected.add(slot === 'base' ? `wc-${name}` : `wc-${name}-${kebab(slot)}`);
        for (const [variant, values] of Object.entries(recipe.variants ?? {})) {
            const keys = Object.keys(values);
            const boolean = keys.every((v) => v === 'true' || v === 'false');
            const fallback = String(recipe.defaultVariants?.[variant]);
            for (const value of keys) {
                if (!boolean && value === fallback) continue;
                expected.add(`wc-${name}-${kebab(boolean ? variant : value)}`);
            }
            if (!boolean && keys.length > 1 && hasClasses(values[fallback])) {
                expect(css, `${name}: default ${variant}=${fallback}`).toMatch(
                    new RegExp(`\\.wc-${name}[\\w-]*:not\\(`)
                );
            }
        }
        for (const cls of expected) expect(compiled, cls).toContain(`.${cls}`);
    });

    it('applies only utilities Tailwind knows (the build compiles every rule)', () => {
        const applied = [...css.matchAll(/@apply ([^;]+);/g)].length;
        expect(applied).toBe(blocks.reduce((sum, block) => sum + block.rules.length, 0));
        expect(compiled).not.toContain('@apply');
    });

    // group/row on the row, group-data-[state=selected]/row: on a cell → the cell styles follow the row's state
    it('rewrites named group variants to the slot class of the group', () => {
        expect(compiled).toContain(':where(.wc-data-table-row:hover) .wc-data-table-pinned{');
        expect(compiled).toContain(':where(.wc-data-table-row[data-state=selected]) .wc-data-table-pinned{');
        expect(compiled).toContain(':where(.wc-speed-dial-item[data-highlighted]) .wc-speed-dial-action{');
    });

    it('ships the fonts with relative URLs (no CDN)', () => {
        expect(compiled).toMatch(/url\(\.\/fonts\/schibsted-grotesk-latin-wght-normal\.woff2\)/);
        expect(compiled).not.toMatch(/url\((https?:)?\/\//);
    });

    // The fonts (SIL OFL 1.1) need their licence next to them, the bundled Tailwind preflight (MIT) its notice
    it('ships the font licence and the Tailwind licence banner', () => {
        const ofl = readFileSync(new URL('../dist/fonts/OFL.txt', import.meta.url), 'utf8');
        expect(ofl).toContain('Copyright 2023 The Schibsted-Grotesk Project Authors');
        expect(ofl).toContain('Copyright 2020 The JetBrains Mono Project Authors');
        expect(ofl).toContain('SIL OPEN FONT LICENSE Version 1.1');
        expect(compiled).toMatch(/^\/\*! @wirecore\/wirelayer-css .*\n\/\*! tailwindcss v4\.\S+ \| MIT License/);
        expect(compiled).toContain('SIL Open Font License 1.1 | fonts/OFL.txt');
    });
});
