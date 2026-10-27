// @vitest-environment node
// The Vite plugin @wirecore/wirelayer-recipes/vite: finds the WireLayer imports of an app (fixtures/vite-sources) and
// adds their sources files to the CSS file that imports theme.css – the CSS then has the classes of exactly these
// components, and is much smaller than with styles.css.
import { compile, optimize } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { findImports, wirelayer } from '@wirecore/wirelayer-recipes/vite';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const app = join(import.meta.dirname, '../fixtures/vite-sources');
const styles = join(app, 'src/style.css');

/** The plugin's hooks as Vite calls them in a build */
function transform(code: string) {
    const plugin = wirelayer();
    (plugin.configResolved as (config: { root: string }) => void)({ root: app });
    (plugin.buildStart as () => void)();
    const result = (plugin.transform as (code: string, id: string) => { code: string } | undefined)(code, styles);
    return result?.code;
}

/** Like @tailwindcss/vite: the candidates of the detected sources and of every @source */
async function build(css: string) {
    const compiler = await compile(css, { base: join(app, 'src'), onDependency: () => {} });
    const scanner = new Scanner({ sources: [{ base: app, pattern: '**/*', negated: false }, ...compiler.sources] });
    return optimize(compiler.build(scanner.scan()), { minify: true }).code;
}

describe('findImports', () => {
    it('reads named imports (with aliases and sub paths), skips types, notes namespace imports', () => {
        const found = findImports(`
            import { Button, Card as Panel, type ButtonProps } from '@wirecore/wirelayer-react';
            import type { DataTableProps } from '@wirecore/wirelayer-react/data-table';
            import { DataTable } from "@wirecore/wirelayer-react/data-table";
            import * as Blocks from '@wirecore/wirelayer-blocks-vue';
            export { prose } from '@wirecore/wirelayer-recipes';
            import { ref } from 'vue';
        `);
        expect(Object.fromEntries([...found].map(([pkg, names]) => [pkg, [...names].sort()]))).toEqual({
            '@wirecore/wirelayer-react': ['Button', 'Card', 'DataTable'],
            '@wirecore/wirelayer-blocks-vue': ['*'],
            '@wirecore/wirelayer-recipes': ['prose'],
        });
    });
});

describe('wirelayer()', () => {
    const ignored = join(app, 'node_modules/ignored');
    mkdirSync(ignored, { recursive: true });
    writeFileSync(join(ignored, 'index.ts'), "import { Scheduler } from '@wirecore/wirelayer-react';\n");
    afterAll(() => rmSync(join(app, 'node_modules'), { recursive: true, force: true }));

    it('adds the sources files of the used components and recipes right after the theme import', () => {
        const code = transform(readFileSync(styles, 'utf8'))!;
        const added = code.match(/@import '[^']+\/sources\/[\w-]+\.css'/g)!.map((line) => line.split('/').at(-1));
        expect(added.sort()).toEqual(["Badge.css'", "Button.css'", "Card.css'", "DataTable.css'", "prose.css'"]);
        expect(code.indexOf('/sources/')).toBeGreaterThan(code.indexOf('theme.css'));
        // node_modules is skipped, other CSS files stay as they are
        expect(code).not.toContain('Scheduler.css');
        expect(transform("@import 'tailwindcss';")).toBeUndefined();
    });

    it('the CSS has the classes of these components and is much smaller than with styles.css', async () => {
        const css = await build(transform(readFileSync(styles, 'utf8'))!);
        const recipes = css.match(/--wc-recipe-\w+/g) ?? [];
        expect(recipes).toEqual(
            expect.arrayContaining(['--wc-recipe-button', '--wc-recipe-card', '--wc-recipe-dataTable'])
        );
        expect(recipes).toEqual(expect.arrayContaining(['--wc-recipe-badge', '--wc-recipe-prose']));
        expect(recipes).not.toContain('--wc-recipe-scheduler');
        const full = await build("@import 'tailwindcss';\n@import '@wirecore/wirelayer-react/styles.css';");
        expect(css.length).toBeLessThan(full.length / 2);
        console.info(
            `theme.css + plugin: ${(css.length / 1024).toFixed(0)} kB, styles.css: ${(full.length / 1024).toFixed(0)} kB`
        );
    });
});
