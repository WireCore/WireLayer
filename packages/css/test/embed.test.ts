import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'lightningcss';
import { describe, expect, it } from 'vitest';
import { scopeCss, splitLayers } from '../src/embed.ts';

const bin = fileURLToPath(new URL('../bin/wirelayer-css.js', import.meta.url));
const compiled = readFileSync(new URL('../dist/wirecore.css', import.meta.url), 'utf8');

/** Runs `wirelayer-css embed` into a fresh directory and returns it with the written CSS */
function embed(...args: string[]) {
    const out = mkdtempSync(join(tmpdir(), 'wirelayer-embed-'));
    execFileSync('node', [bin, 'embed', '--out', out, ...args]);
    return { out, css: readFileSync(join(out, 'wirelayer.css'), 'utf8') };
}

/** Every selector of the style rules (also inside @media, @supports …) as JSON */
function selectors(css: string) {
    const found: string[] = [];
    transform({
        filename: 'embed.css',
        code: Buffer.from(css),
        visitor: {
            Selector(selector) {
                found.push(JSON.stringify(selector));
            },
        },
    });
    return found;
}

describe('scopeCss', () => {
    const scoped = (css: string, kind: 'components' | 'base') => scopeCss(css, kind).replaceAll('wirelayer-scope', 'S');

    it('puts components inside the scope', () => {
        expect(scoped('.wc-a:hover{color:red}', 'components')).toBe('#S .wc-a:hover{color:red}');
    });

    it('applies base styles to the scope element and everything inside it', () => {
        expect(scoped('*,::before{margin:0}', 'base')).toBe(':is(#S,#S *),:is(#S,#S *):before{margin:0}');
        expect(scoped('input:where([type=button]){margin:0}', 'base')).toBe(
            'input:where([type=button]):is(#S,#S *){margin:0}'
        );
    });

    // data-mode/data-theme on the scope work as on <html>, with the same order of precedence
    it('turns :root, :host, html and body into the scope', () => {
        expect(scoped(':root,[data-mode=light]{--a:1}', 'base')).toBe('#S,[data-mode=light]:is(#S,#S *){--a:1}');
        expect(scoped('html,:host{--a:1}body{--b:1}', 'base')).toBe('#S,#S{--a:1}#S{--b:1}');
        expect(scoped('.wc-a:where(:root:not([data-mode]) *){color:red}', 'components')).toBe(
            '#S .wc-a:where(#S:not([data-mode]) *){color:red}'
        );
    });

    it('dissolves every layer, also nested ones', () => {
        expect(scoped('@layer a,b;@layer a{.x{color:red}@layer b{.y{color:red}}}', 'components')).toBe(
            '#S .x,#S .y{color:red}'
        );
    });
});

it('splitLayers cuts the marked layers out', () => {
    const { parts, rest } = splitLayers('a{b:c}@layer p-x{.x{content:"}"}@media (x){.y{d:e}}}f{g:h}', 'p-');
    expect(parts).toEqual(new Map([['x', '.x{content:"}"}@media (x){.y{d:e}}']]));
    expect(rest).toBe('a{b:c}f{g:h}');
});

describe('wirelayer-css embed', () => {
    it('scopes every selector and leaves no layer', () => {
        const { css } = embed('--scope', '#app', '--components', 'all');
        expect(css).not.toContain('@layer');
        expect(css).not.toContain('wirelayer-scope');
        const outside = selectors(css).filter((selector) => !selector.includes('{"type":"id","name":"app"}'));
        expect(outside).toEqual([]);
    });

    // Cut into parts and put together again, nothing of wirecore.css is lost
    it('contains every class of wirecore.css with "all"', () => {
        const { css } = embed('--scope', '#app', '--components', 'all');
        const classes = (text: string) => new Set(text.match(/\.wc-[\w-]+/g));
        const missing = [...classes(compiled)].filter((name) => !classes(css).has(name));
        expect(missing).toEqual([]);
    });

    it('takes only the chosen components and their parts', () => {
        const { css, out } = embed('--scope', '.app', '--components', 'button,card');
        expect(css).toContain('.app .wc-button{');
        expect(css).toContain('.app .wc-card-parts-header');
        expect(css).not.toContain('.wc-accordion');
        expect(css).toMatch(/^\/\*! @wirecore\/wirelayer-css .*\n\/\*! tailwindcss v4\.\S+ \| MIT License/);
        expect(css).toContain('url(./fonts/schibsted-grotesk-latin-wght-normal.woff2)');
        expect(readFileSync(join(out, 'fonts', 'OFL.txt'), 'utf8')).toContain('SIL OPEN FONT LICENSE Version 1.1');
    });

    it('leaves out the fonts with --no-fonts', () => {
        const { css, out } = embed('--scope', '#app', '--components', 'button', '--no-fonts');
        expect(css).not.toContain('@font-face');
        expect(existsSync(join(out, 'fonts'))).toBe(false);
    });

    it.each([
        [['--scope', 'body .app', '--components', 'button'], '--scope must be one id or class'],
        [['--scope', '#app', '--components', 'buton'], 'unknown components: buton'],
        [['--components', 'button'], '--scope, --components and --out are required'],
    ])('rejects %j', (args, message) => {
        const result = spawnSync('node', [bin, 'embed', '--out', tmpdir(), ...args], { encoding: 'utf8' });
        expect(result.status).toBe(1);
        expect(result.stderr).toContain(message);
    });
});
