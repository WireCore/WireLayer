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

describe('parse', () => {
    it('reads oklch with the lightness and chroma in percent, as minified CSS writes it', () => {
        expect(parse('oklch(47% .13 155)')).toEqual(parse('oklch(0.47 0.13 155)'));
        expect(parse('oklch(47% 32.5% 155)')).toEqual(parse('oklch(0.47 0.13 155)'));
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

// A strong orange with white text: the colour itself meets 4.5:1, its faded hover and the tinted hovers do not
const orange = defineTheme({
    name: 'orange',
    label: 'Orange',
    colors: { light: { primary: '#b24300', 'on-primary': '#FFFFFF' }, dark: {} },
});
const hoverPairs = /^(primary hover on |soft primary hover: |avatar primary hover: |primary outline hover: )/;

describe('accent', () => {
    const names = (theme: Parameters<typeof checkTheme>[0], mode: 'light' | 'dark') =>
        contrastPairs(resolveColors(theme, mode)).map((pair) => pair.name);

    it('is only checked once a theme sets it – until then it is the primary colour', () => {
        expect(names(themes[0]!, 'light').filter((name) => name.includes('accent'))).toEqual([]);
        const teal = defineTheme({
            name: 'two-colours',
            label: 'Two colours',
            colors: { light: { accent: '#00696d', 'on-accent': '#FFFFFF' }, dark: {} },
        });
        expect(names(teal, 'light')).toEqual(
            expect.arrayContaining([
                'accent: text-on-accent on bg-accent',
                'text-accent on bg',
                'text-accent on bg-2',
                'text-accent on card',
            ])
        );
        expect(names(teal, 'dark').filter((name) => name.includes('accent'))).toEqual([]);
        expect(checkTheme(teal)).toEqual([]);
    });

    it('reports an accent that misses its pairs, with a fix', () => {
        const pale = defineTheme({
            name: 'pale-accent',
            label: 'Pale accent',
            colors: { light: { accent: '#2bb5ba', 'on-accent': '#FFFFFF' }, dark: {} },
        });
        expect(checkTheme(pale).map((failure) => failure.name)).toEqual(
            expect.arrayContaining(['accent: text-on-accent on bg-accent', 'text-accent on bg'])
        );
        const fix = suggestThemeFixes(pale).find((item) => item.name === 'text-accent on bg')!;
        expect(fix.color?.token).toBe('accent');
        expect(contrast(parse(fix.color!.value), parse('#FFFFFF'))).toBeGreaterThanOrEqual(4.5);
    });
});

describe('primary-hover', () => {
    it('reports the faded and tinted hovers of a primary colour that meets 4.5:1 itself', () => {
        const failures = checkTheme(orange).map((failure) => failure.name);
        expect(failures).not.toContain('primary: text-on-primary on bg-primary');
        expect(failures).toContain('primary hover on bg');
        expect(failures).toContain('soft primary hover: text-primary on bg-primary/14 (bg-2)');
        expect(failures.every((name) => hoverPairs.test(name))).toBe(true);
    });

    it('suggests one primary-hover for every hover pair and keeps the primary colour', () => {
        const suggestions = suggestThemeFixes(orange);
        const values = new Set(suggestions.map((item) => item.color?.token === 'primary-hover' && item.color.value));
        expect(suggestions.every((item) => item.color?.token === 'primary-hover')).toBe(true);
        expect(values.size).toBe(1);
        const [value] = [...values] as string[];
        // Darker than the orange (white text), and applied it passes every pair
        expect(rgbToOklch(parse(value!)).l).toBeLessThan(rgbToOklch(parse('#b24300')).l);
        const fixed = defineTheme({
            ...orange,
            colors: { light: { ...orange.colors.light, 'primary-hover': value }, dark: {} },
        });
        expect(checkTheme(fixed)).toEqual([]);
    });

    it('checks the hover with primary-hover instead of the fade', () => {
        const light = (theme: Parameters<typeof checkTheme>[0]) =>
            contrastPairs(resolveColors(theme, 'light')).find((pair) => pair.name === 'primary hover on bg')!.ratio;
        const own = defineTheme({
            ...orange,
            colors: { light: { ...orange.colors.light, 'primary-hover': '#8f3500' }, dark: {} },
        });
        expect(light(own)).toBeCloseTo(contrast(parse('#FFFFFF'), parse('#8f3500')), 5);
        expect(light(orange)).toBeLessThan(light(own));
    });

    it('still checks tinted primary at rest, which the hover pairs no longer cover', () => {
        // Passes the hover pairs with a dark hover colour, but the orange text on its own tint misses 4.5:1
        const light = defineTheme({
            name: 'light-orange',
            label: 'Light orange',
            colors: { light: { primary: '#c24900', 'on-primary': '#FFFFFF', 'primary-hover': '#8f3500' }, dark: {} },
        });
        const failures = checkTheme(light).map((failure) => failure.name);
        expect(failures).toContain('soft primary: text-primary on bg-primary/10 (bg-2)');
        expect(failures).toContain('avatar primary: text-primary on primary/14 (card)');
        expect(failures.some((name) => hoverPairs.test(name))).toBe(false);
    });
});
