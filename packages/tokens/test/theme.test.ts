import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

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
