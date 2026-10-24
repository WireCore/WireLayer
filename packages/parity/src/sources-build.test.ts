// @vitest-environment node
// The sources files in the Tailwind build of an app as npm installs it: the packages in node_modules (left out by
// .gitignore) and automatic source detection (@import 'tailwindcss'). A sources file must bring the classes of its
// recipes and nothing more – Tailwind scans the whole folder of a file that an @source there points to, so class
// lists as files next to each other brought the classes of all recipes with each import.
import { compile, optimize } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import * as recipes from '@wirecore/wirelayer-recipes';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, expect, it } from 'vitest';
import { isRecipe, recipeClasses, writeComponentSources, writeRecipeSources } from '../../../scripts/sources.ts';

const tailwind = createRequire(import.meta.url).resolve('tailwindcss/index.css');
const packages = join(import.meta.dirname, '../..');
const module = recipes as Record<string, unknown>;
const recipeNames = new Set(Object.keys(module).filter((name) => isRecipe(module[name])));

const app = mkdtempSync(join(tmpdir(), 'wirelayer-sources-'));
afterAll(() => rmSync(app, { recursive: true, force: true }));
writeFileSync(join(app, '.gitignore'), 'node_modules\n');
writeFileSync(join(app, 'index.html'), '<main></main>\n');
const installed = (name: string) => {
    const dir = join(app, 'node_modules/@wirecore', `wirelayer-${name}`);
    mkdirSync(dir, { recursive: true });
    copyFileSync(join(packages, name, 'package.json'), join(dir, 'package.json'));
    return join(dir, 'dist/sources');
};
writeRecipeSources(installed('recipes'), module);
writeComponentSources(join(packages, 'blocks-vue'), installed('blocks-vue'), recipeNames);

/** Like @tailwindcss/vite: the candidates of the detected sources (unless source(none)) and of every @source */
async function build(css: string) {
    const compiler = await compile(css, { base: app, onDependency: () => {} });
    const detected = compiler.root === 'none' ? [] : [{ base: app, pattern: '**/*', negated: false }];
    const scanner = new Scanner({ sources: [...detected, ...compiler.sources] });
    return optimize(compiler.build(scanner.scan()), { minify: true }).code;
}

it.each(['@wirecore/wirelayer-recipes/sources/card.css', '@wirecore/wirelayer-blocks-vue/sources/SiteHeader.css'])(
    '%s brings the same classes with automatic source detection',
    async (file) => {
        const exact = await build(`@import '${tailwind}' source(none);\n@import '${file}';`);
        expect(await build(`@import '${tailwind}';\n@import '${file}';`)).toBe(exact);
    }
);

// Also the quoting of @source inline(): content-[""] and content-['▸'] must reach Tailwind unchanged
it.each([...recipeNames])('sources/%s.css brings exactly the classes of the recipe', async (name) => {
    const css = await build(
        `@import '${tailwind}' source(none);\n@import '@wirecore/wirelayer-recipes/sources/${name}.css';`
    );
    const compiler = await compile(`@import '${tailwind}' source(none);\n:root {\n    --wc-recipe-${name}: 1;\n}`, {
        base: app,
        onDependency: () => {},
    });
    expect(css).toBe(optimize(compiler.build(recipeClasses(module[name] as never)), { minify: true }).code);
});

it('SiteHeader.css brings the recipes SiteHeader renders', async () => {
    const css = await build(
        `@import '${tailwind}' source(none);\n@import '@wirecore/wirelayer-blocks-vue/sources/SiteHeader.css';`
    );
    expect(css.match(/--wc-recipe-\w+/g)?.sort()).toEqual(['--wc-recipe-iconButton', '--wc-recipe-siteHeader']);
});
