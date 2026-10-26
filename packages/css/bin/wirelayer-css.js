#!/usr/bin/env node
// wirelayer-css embed – WireLayer for a page that brings its own CSS (WordPress admin, a host app …): the chosen
// components, scoped to one element, without @layer, in one file next to the fonts. The parts come precompiled from
// dist/embed/ (scripts/build.ts) – no Tailwind needed.
//
//   wirelayer-css embed --scope '#my-app' --components button,input,card --out assets/wirelayer [--no-fonts]
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const usage = `Usage: wirelayer-css embed --scope <#id|.class> --components <a,b,…> --out <dir> [--no-fonts]

  --scope       the element that contains the WireLayer markup – an id (#my-app) outranks the page's own CSS
  --components  component names as in the class reference (button, card …), comma separated; "all" for all
  --out         directory for wirelayer.css and fonts/
  --no-fonts    leave out the fonts (Schibsted Grotesk, JetBrains Mono)`;

const fail = (message) => {
    console.error(`wirelayer-css: ${message}\n\n${usage}`);
    process.exit(1);
};

let args;
try {
    args = parseArgs({
        allowPositionals: true,
        options: {
            scope: { type: 'string' },
            components: { type: 'string' },
            out: { type: 'string' },
            'no-fonts': { type: 'boolean', default: false },
        },
    });
} catch (error) {
    fail(error.message);
}
const { positionals, values } = args;
if (positionals[0] !== 'embed' || positionals.length > 1) fail('unknown command');
if (!values.scope || !values.components || !values.out) fail('--scope, --components and --out are required');
// One compound selector: the build joins it with type selectors (input#my-app), so it has to be a single name
if (!/^[#.][A-Za-z_][\w-]*$/.test(values.scope)) fail(`--scope must be one id or class, not "${values.scope}"`);

const embed = fileURLToPath(new URL('../dist/embed/', import.meta.url));
const read = (file) => readFileSync(join(embed, file), 'utf8');
/** @type {string[]} */
const available = JSON.parse(read('components.json'));
const requested = values.components.split(/[\s,]+/).filter(Boolean);
const unknown = requested.filter((name) => name !== 'all' && !available.includes(name));
if (unknown.length) fail(`unknown components: ${unknown.join(', ')} (see llms.txt for the names)`);
// <name>-parts holds the parts of some components (card-parts, textarea-parts) – they come along
const wanted = new Set(requested.flatMap((name) => (name === 'all' ? available : [name, `${name}-parts`])));
const chosen = available.filter((name) => wanted.has(name));

const css = [
    read('base.css'),
    values['no-fonts'] ? '' : read('fonts.css'),
    ...chosen.map((name) => read(`components/${name}.css`)),
    read('native-elements.css'),
]
    .filter(Boolean)
    .join('\n')
    .replaceAll('#wirelayer-scope', values.scope);

mkdirSync(values.out, { recursive: true });
writeFileSync(join(values.out, 'wirelayer.css'), `${css}\n`);
if (!values['no-fonts']) {
    const fonts = fileURLToPath(new URL('../dist/fonts/', import.meta.url));
    mkdirSync(join(values.out, 'fonts'), { recursive: true });
    for (const file of readdirSync(fonts)) copyFileSync(join(fonts, file), join(values.out, 'fonts', file));
}
console.log(`${chosen.length} components → ${join(values.out, 'wirelayer.css')} (${Math.round(css.length / 1024)} kB)`);
