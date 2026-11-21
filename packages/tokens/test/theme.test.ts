import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { radius, themes, themeToCss } from '../src/index.js';

const css = readFileSync(new URL('../dist/theme.css', import.meta.url), 'utf8');

// Splits the CSS into its top-level @theme blocks
const blocks = [...css.matchAll(/@theme( inline)? \{/g)].map((match) => {
    let depth = 1;
    let end = match.index + match[0].length;
    while (depth > 0 && end < css.length) {
        if (css[end] === '{') depth++;
        else if (css[end] === '}') depth--;
        end++;
    }
    return { inline: !!match[1], body: css.slice(match.index + match[0].length, end - 1) };
});

describe('animation theme variables', () => {
    // A theme variable holds its value on :root. An animation that reads a variable set later on the element itself
    // (Ark: --duration, --marquee-duration …) must therefore be `@theme inline`, or it resolves to nothing there and
    // the animation silently does not run.
    it('keeps animations that read element variables in an inline theme block', () => {
        const dynamic = blocks.flatMap((block) =>
            [...block.body.matchAll(/--animate-[\w-]+:[^;]*var\(--[^;]*;/g)].map((m) => ({
                inline: block.inline,
                rule: m[0],
            }))
        );
        expect(dynamic.length).toBeGreaterThan(0);
        for (const { inline, rule } of dynamic) expect(inline, rule).toBe(true);
    });
});

describe('popup positioners', () => {
    // Vue patches Ark's inline z-index of a positioner away when it renders again – the stylesheet keeps it
    it('gives every Ark positioner the z-index Ark copied from its content, in the base layer', () => {
        expect(css).toMatch(
            /@layer base \{[^@]*\[data-scope\]\[data-part='positioner'\] \{\s*z-index: var\(--z-index\);/
        );
    });
});

describe('light and dark', () => {
    // Without data-mode the page follows the system; data-mode="light"|"dark" forces a mode (checked in the browser
    // as well – this keeps the generated rules from getting lost)
    it('uses the dark colours for a page without data-mode when the system is dark', () => {
        expect(css).toMatch(
            /@media \(prefers-color-scheme: dark\) \{\s*\/\*[^*]*\*\/\s*:root:where\(:not\(\[data-mode\]\)\) \{\s*color-scheme: dark;/
        );
    });

    it('also applies the dark variant to a page without data-mode, except in a forced light part', () => {
        expect(css).toContain('&:where([data-mode=dark], [data-mode=dark] *)');
        expect(css).toContain(
            '&:where(:root:not([data-mode]), :root:not([data-mode]) *):not(:where([data-mode=light], [data-mode=light] *))'
        );
    });

    it('gives every theme with dark colours the system case, too', () => {
        for (const theme of themes.filter((theme) => Object.keys(theme.colors.dark).length)) {
            const rules = themeToCss(theme);
            expect(rules, theme.name).toContain(`:root:not([data-mode])[data-theme=${theme.name}]`);
            expect(css, theme.name).toContain(rules);
        }
    });
});

describe('optional colour tokens', () => {
    const native = readFileSync(new URL('../dist/native.css', import.meta.url), 'utf8');

    // Not declared on :root – the Tailwind colour reads the token of the theme and else the one it follows, also in
    // nested themes (data-theme on a part of the page)
    it('follows the token it falls back to when a theme does not set it', () => {
        expect(css).toContain('--color-accent: var(--wc-accent, var(--wc-primary));');
        expect(css).toContain('--color-on-accent: var(--wc-on-accent, var(--wc-on-primary));');
        expect(css).toContain('--color-primary-hover: var(--wc-primary-hover, var(--wc-primary));');
        expect(css).not.toMatch(/--wc-(accent|on-accent|primary-hover):/);
    });

    it('is part of the CSS of a theme that sets it', () => {
        const rules = themeToCss({
            name: 'brand',
            label: 'Brand',
            colors: { light: { accent: '#00696d', 'primary-hover': '#8f3500' }, dark: { accent: '#2aa0a5' } },
        });
        expect(rules).toContain('--wc-accent: #00696d;');
        expect(rules).toContain('--wc-primary-hover: #8f3500;');
        expect(rules).toContain('--wc-accent: #2aa0a5;');
    });

    it('gives React Native a fixed colour per theme and mode', () => {
        const variants = native.split('@variant ').slice(1);
        expect(variants).toHaveLength(themes.length * 2);
        for (const variant of variants) {
            expect(variant).toMatch(/--color-accent: [^;v]+;/);
            expect(variant).toMatch(/--color-primary-hover: [^;v]+;/);
        }
    });
});

describe('radii', () => {
    const native = readFileSync(new URL('../dist/native.css', import.meta.url), 'utf8');

    // Not inline: rounded-dialog reads var(--radius-dialog), so a theme can set it to 0 (square corners)
    it('declares every radius as a theme variable for the web and React Native', () => {
        expect(radius).toMatchObject({ card: '20px', panel: '28px', popup: '12px', dialog: '14px' });
        const plain = blocks
            .filter((block) => !block.inline)
            .map((block) => block.body)
            .join('\n');
        for (const [name, value] of Object.entries(radius)) {
            expect(plain).toContain(`--radius-${name}: ${value};`);
            expect(native).toContain(`--radius-${name}: ${value};`);
        }
    });
});
