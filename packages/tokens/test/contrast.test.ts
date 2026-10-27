import { describe, expect, it } from 'vitest';
import {
    checkTheme,
    contrast,
    contrastPairs,
    defineTheme,
    modes,
    parse,
    resolveColors,
    rgbToOklch,
    suggestThemeFixes,
    themes,
} from '../src/index.js';

describe.each(themes)('theme $name', (theme) => {
    describe.each(modes)('%s mode', (mode) => {
        it.each(contrastPairs(resolveColors(theme, mode)).map((result) => [result.name, result] as const))(
            '%s',
            (_, { ratio, min }) => {
                expect(ratio, `${ratio.toFixed(2)}:1 < ${min}:1`).toBeGreaterThanOrEqual(min);
            }
        );
    });
});

describe('checkTheme', () => {
    it('reports the pairs a custom theme misses', () => {
        const pale = defineTheme({
            name: 'pale',
            label: 'Pale',
            colors: { light: { primary: '#BBBBBB' }, dark: {} },
        });
        const failures = checkTheme(pale).map((failure) => `${failure.mode}: ${failure.name}`);
        expect(failures).toContain('light: primary: text-on-primary on bg-primary');
        expect(failures).toContain('light: selected/focus primary on bg');
    });
});

describe('suggestThemeFixes', () => {
    // An orange brand colour with white text: about 2.6:1
    const brand = defineTheme({
        name: 'brand',
        label: 'Brand',
        colors: { light: { primary: '#da9035', 'on-primary': '#FFFFFF' }, dark: {} },
    });

    it('suggests the nearest lightness of the colour and a fitting on-colour per missed pair', () => {
        const suggestions = suggestThemeFixes(brand);
        expect(suggestions.map((item) => `${item.mode}: ${item.name}`)).toEqual(
            checkTheme(brand).map((failure) => `${failure.mode}: ${failure.name}`)
        );
        const button = suggestions.find((item) => item.name === 'primary: text-on-primary on bg-primary')!;
        expect(button.ratio).toBeCloseTo(2.6, 1);
        // The darker orange: same hue, white text reaches 4.5:1
        expect(button.color?.token).toBe('primary');
        expect(contrast(parse(button.color!.value), parse('#FFFFFF'))).toBeGreaterThanOrEqual(4.5);
        const before = rgbToOklch(parse('#da9035'));
        const after = rgbToOklch(parse(button.color!.value));
        expect(after.l).toBeLessThan(before.l);
        expect(Math.abs(after.h - before.h)).toBeLessThan(1);
        // Or dark text on the orange as it is
        expect(button.on).toMatchObject({ token: 'on-primary', value: '#050505' });
        expect(button.on!.ratio).toBeGreaterThanOrEqual(4.5);
        // Applied, the suggestion passes the check (for this pair, without breaking others)
        const fixed = defineTheme({
            ...brand,
            colors: { light: { primary: button.color!.value, 'on-primary': '#FFFFFF' }, dark: {} },
        });
        expect(checkTheme(fixed).map((failure) => failure.name)).not.toContain(button.name);
    });

    it('is empty for the built-in themes', () => {
        for (const theme of themes) expect(suggestThemeFixes(theme)).toEqual([]);
    });
});
