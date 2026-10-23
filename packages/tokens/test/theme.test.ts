import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { themes, themeToCss } from '../src/index.js';

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
