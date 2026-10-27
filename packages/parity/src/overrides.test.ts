import { screen } from '@testing-library/dom';
import {
    button,
    mergeRecipeOverrides,
    tv,
    withRecipeOverrides,
    type RecipeConfig,
    type RecipeOverrides,
} from '@wirecore/wirelayer-recipes';
import { describe, expect, it } from 'vitest';
import { el, frameworks, render } from './harness.js';

// Overrides per variant value and per combination of variants (RecipesProvider, useRecipe)

describe('override types', () => {
    it('check the names of variants, values and parts', () => {
        const config: RecipeConfig = {
            button: {
                variants: { size: { md: { base: 'h-11' } }, block: { true: { base: 'max-w-none' } } },
                compoundVariants: [{ size: ['sm', 'md'], shape: 'rounded', classes: { base: 'rounded-md' } }],
            },
            dataTable: { variants: { size: { sm: { td: 'py-0.5' } } } },
        };
        // @ts-expect-error – no variant "tone"
        const variant: RecipeConfig = { button: { variants: { tone: { md: { base: 'h-11' } } } } };
        // @ts-expect-error – no size "huge"
        const value: RecipeConfig = { button: { variants: { size: { huge: { base: 'h-11' } } } } };
        // @ts-expect-error – no part "label"
        const part: RecipeConfig = { button: { variants: { size: { md: { label: 'h-11' } } } } };
        // @ts-expect-error – no size "huge" in a compound variant
        const compound: RecipeConfig = { button: { compoundVariants: [{ size: 'huge', classes: { base: 'x' } }] } };
        expect([config, variant, value, part, compound]).toHaveLength(5);
    });
});

describe('overrides per variant', () => {
    const field = tv({
        slots: { base: 'h-10 border border-line', label: 'text-fg' },
        variants: {
            size: { sm: { base: 'h-8' }, md: {} },
            invalid: { true: { base: 'border-danger' } },
        },
        defaultVariants: { size: 'md' },
    });

    it('add classes to the matching value only – the recipe default counts', () => {
        const styled = withRecipeOverrides(button, [{ variants: { size: { md: { base: 'h-[2.625rem]' } } } }]);
        expect(styled({}).base()).toContain('h-[2.625rem]');
        expect(styled({}).base()).not.toContain('h-[var(--wc-control-h-md,2.5rem)]');
        expect(styled({ size: 'sm' }).base()).toContain('h-[var(--wc-control-h-sm,2rem)]');
        expect(styled({ size: 'sm' }).base()).not.toContain('h-[2.625rem]');
        const block = withRecipeOverrides(button, [{ variants: { block: { true: { base: 'max-w-80' } } } }]);
        expect(block({ block: true }).base()).toContain('max-w-80');
        expect(block({}).base()).not.toContain('max-w-80');
    });

    it('compound variants match all their variants, a list matches any of its values', () => {
        const styled = withRecipeOverrides(button, [
            { compoundVariants: [{ size: ['sm', 'md'], shape: 'rounded', classes: { base: 'rounded-sm' } }] },
        ]);
        expect(styled({ shape: 'rounded' }).base()).toContain('rounded-sm');
        expect(styled({ shape: 'rounded', size: 'sm' }).base()).toContain('rounded-sm');
        expect(styled({ shape: 'rounded', size: 'lg' }).base()).not.toContain('rounded-sm');
        expect(styled({}).base()).not.toContain('rounded-sm');
    });

    it('order: classes, variant values, the states of the recipe, the states of the overrides, the own class', () => {
        const styled = withRecipeOverrides(field, [
            { classes: { base: 'border-line-strong' }, variants: { size: { md: { base: 'border-line-2' } } } },
        ]);
        expect(styled({}).base()).toContain('border-line-2');
        expect(styled({}).base()).not.toContain('border-line-strong');
        expect(styled({ invalid: true }).base()).toContain('border-danger');
        const own = withRecipeOverrides(field, [{ variants: { invalid: { true: { base: 'border-warn' } } } }]);
        expect(own({ invalid: true }).base()).toContain('border-warn');
        expect(own({ invalid: true }).base()).not.toContain('border-danger');
        expect(own({ invalid: true }).base({ class: 'border-fg' })).toContain('border-fg');
        // Variants passed to a part count for that part
        expect(own({}).base({ invalid: true })).toContain('border-warn');
    });

    it('nested providers: values are joined per part, the inner one wins; compound variants add up', () => {
        const outer: RecipeOverrides = {
            button: {
                variants: { size: { md: { base: 'h-11 px-5' } } },
                compoundVariants: [{ shape: 'rounded', classes: { base: 'rounded-sm' } }],
            },
        };
        const inner: RecipeOverrides = {
            button: {
                variants: { size: { md: { base: 'h-12' }, sm: { icon: 'size-3' } } },
                compoundVariants: [{ shape: 'rounded', classes: { base: 'rounded-xs' } }],
            },
        };
        const merged = mergeRecipeOverrides(outer, inner);
        const styled = withRecipeOverrides(button, [merged.button]);
        const base = styled({ shape: 'rounded' }).base();
        expect(base).toContain('h-12');
        expect(base).toContain('px-5');
        expect(base).not.toContain('h-11');
        expect(base).toContain('rounded-xs');
        expect(base).not.toContain('rounded-sm');
        expect(styled({ size: 'sm' }).icon()).toContain('size-3');
    });
});

describe.each(frameworks)('%s overrides per variant', (framework) => {
    it('RecipesProvider: only buttons of the medium size change; an inner provider wins', async () => {
        await render(
            framework,
            el(
                'RecipesProvider',
                { recipes: { button: { variants: { size: { md: { base: 'h-[2.625rem] text-base' } } } } } },
                el('Button', {}, 'Medium'),
                el('Button', { size: 'sm' }, 'Small'),
                el(
                    'RecipesProvider',
                    { recipes: { button: { variants: { size: { md: { base: 'h-12' } } } } } },
                    el('Button', {}, 'Inner')
                )
            )
        );
        expect(screen.getByRole('button', { name: 'Medium' })).toHaveClass('h-[2.625rem]', 'text-base');
        expect(screen.getByRole('button', { name: 'Small' })).toHaveClass('h-[var(--wc-control-h-sm,2rem)]');
        expect(screen.getByRole('button', { name: 'Small' })).not.toHaveClass('h-[2.625rem]');
        expect(screen.getByRole('button', { name: 'Inner' })).toHaveClass('h-12', 'text-base');
    });
});
