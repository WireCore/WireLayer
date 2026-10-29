// @vitest-environment node
// The Vite plugin @wirecore/wirelayer-recipes/vite: finds the WireLayer imports of an app (fixtures/vite-sources) and
// adds their sources files to the CSS file that imports theme.css – the CSS then has the classes of exactly these
// components, and is much smaller than with styles.css.
import { compile, optimize } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import * as recipes from '@wirecore/wirelayer-recipes';
import { findImports, wirelayer } from '@wirecore/wirelayer-recipes/vite';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { isRecipe, writeComponentSources, writeRecipeSources } from '../../../scripts/sources.ts';

const app = join(import.meta.dirname, '../fixtures/vite-sources');
const styles = join(app, 'src/style.css');
const packages = join(import.meta.dirname, '../..');

// The packages as npm installs them, in the app's node_modules: an entry to resolve (dist, or src under the tests'
// wirecore:source condition) and dist/sources – without a build of the workspace packages
const module = recipes as Record<string, unknown>;
const recipeNames = new Set(Object.keys(module).filter((name) => isRecipe(module[name])));
const installed = (name: string, files: string[] = []) => {
    const dir = join(app, 'node_modules/@wirecore', `wirelayer-${name}`);
    for (const entry of ['dist/index.js', 'src/index.ts']) {
        mkdirSync(join(dir, entry, '..'), { recursive: true });
        writeFileSync(join(dir, entry), '');
    }
    for (const file of ['package.json', ...files]) copyFileSync(join(packages, name, file), join(dir, file));
    return join(dir, 'dist/sources');
};
writeRecipeSources(installed('recipes'), module);
writeComponentSources(join(packages, 'react'), installed('react', ['theme.css']), recipeNames);
writeComponentSources(join(packages, 'vue'), installed('vue'), recipeNames);
afterAll(() => rmSync(join(app, 'node_modules'), { recursive: true, force: true }));

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
        const full = await build(`@import 'tailwindcss';\n@import '${join(packages, 'react/styles.css')}';`);
        expect(css.length).toBeLessThan(full.length / 2);
        console.info(
            `theme.css + plugin: ${(css.length / 1024).toFixed(0)} kB, styles.css: ${(full.length / 1024).toFixed(0)} kB`
        );
    });
});

describe('wirelayer() in the dev server', () => {
    // @tailwindcss/vite only builds a CSS file again when a file it imports changed on disk: an import added while the
    // dev server runs has to reach such a file, or its classes are missing until a restart
    it('keeps the imports in a file of its own and rewrites it when a new import appears', async () => {
        const cacheDir = join(app, 'node_modules/.vite');
        const file = join(cacheDir, 'wirelayer-sources.css');
        const handlers = new Map<string, (path: string) => void>();
        const reloaded: unknown[] = [];
        const server = {
            watcher: { on: (event: string, handler: (path: string) => void) => handlers.set(event, handler) },
            moduleGraph: { getModuleById: (id: string) => ({ id }) },
            reloadModule: async (module: unknown) => void reloaded.push(module),
        };
        const plugin = wirelayer();
        (plugin.configResolved as (config: { root: string; cacheDir: string }) => void)({ root: app, cacheDir });
        (plugin.configureServer as unknown as (devServer: typeof server) => void)(server);
        (plugin.buildStart as () => void)();
        const code = (plugin.transform as (code: string, id: string) => { code: string })(
            readFileSync(styles, 'utf8'),
            styles
        ).code;
        expect(code).toContain(`@import '${file}';`);
        expect(code).not.toContain('/sources/');
        expect(readFileSync(file, 'utf8')).toContain('/sources/Card.css');
        expect(readFileSync(file, 'utf8')).not.toContain('/sources/Avatar.css');

        const added = join(app, 'src/Added.ts');
        writeFileSync(added, "import { Avatar } from '@wirecore/wirelayer-react';\n");
        try {
            handlers.get('add')!(added);
        } finally {
            rmSync(added);
        }
        expect(readFileSync(file, 'utf8')).toContain('/sources/Avatar.css');
        expect(reloaded).toEqual([{ id: styles }]);
        expect(await build(code)).toContain('--wc-recipe-avatar');
    });
});
