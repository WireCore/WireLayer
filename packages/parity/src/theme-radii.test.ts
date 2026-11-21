// @vitest-environment node
// A theme changes the corners through variables: the radius theme variables (rounded-card, rounded-dialog …) and the
// --wc-*-radius variables. A fixed corner in a recipe (rounded-[14px]) cannot be changed – a square theme kept every
// Dialog round. Covers the web and the React Native recipes.
import * as web from '@wirecore/wirelayer-recipes';
import * as native from '@wirecore/wirelayer-recipes/native';
import { radius } from '@wirecore/wirelayer-tokens';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = join(import.meta.dirname, '../../recipes/src');
const sources = readdirSync(src, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.ts'))
    .map((file) => ({ file: file.replaceAll('\\', '/'), code: readFileSync(join(src, file), 'utf8') }));

const matches = (pattern: RegExp, group = 0) =>
    sources.flatMap(({ file, code }) => [...code.matchAll(pattern)].map((match) => `${file}: ${match[group]}`));

/** Fixed corners that stay on purpose (file: class) */
const allowed = [
    // Shapes, not corners: the 6px bars of Progress are pills (like rounded-full), a Highlight marks text, a Gantt
    // milestone is a diamond
    'navigation.ts: rounded-[3px]',
    'navigation.ts: rounded-s-[3px]',
    'navigation.ts: rounded-e-[3px]',
    'navigation.ts: rounded-b-[3px]',
    'navigation.ts: rounded-t-[3px]',
    'native/display.ts: rounded-[3px]',
    'native/data.ts: rounded-[3px]',
    'extras.ts: rounded-[3px]',
    'gantt.ts: rounded-[3px]',
];

describe('theme radii', () => {
    it('recipes take their corners from a variable, except the allowed fixed ones', () => {
        const fixed = new Set(matches(/rounded(?:-[a-z]{1,2})?-\[\d[\d.]*(?:px|r?em)?\]/g));
        expect([...fixed].sort()).toEqual([...allowed].sort());
    });

    it('the square theme of the Themes guide sets every radius variable the recipes read', () => {
        const mdx = readFileSync(join(import.meta.dirname, '../../../apps/storybook/src/Themes.mdx'), 'utf8');
        const square = mdx.match(/### Square corners[\s\S]*?```css\n([\s\S]*?)```/)?.[1] ?? '';
        const read = new Set([
            ...matches(/rounded(?:-[a-z]{1,2})?-\[var\((--[\w-]+)/g, 1).map((entry) => entry.split(': ')[1]),
            ...Object.keys(radius).map((name) => `--radius-${name}`),
        ]);
        expect(read).toContain('--radius-dialog');
        expect(read).toContain('--wc-control-radius-lg');
        for (const variable of read) expect(square, variable).toContain(`${variable}: 0;`);
    });

    it('Dialog, Gallery, Avatar, OrderList, PickList, TimeGrid, TreeSelect and CascadeSelect take a variable', () => {
        const sizes = ['sm', 'md', 'lg'] as const;
        const classes = [
            web.dialog().content(),
            web.dialog().iconBox(),
            native.dialog().content(),
            native.dialog().iconBox(),
            web.gallery().content(),
            web.gallery().lightbox(),
            ...(['sm', 'md', 'lg', 'xl', '2xl'] as const).flatMap((size) => [
                web.avatar({ shape: 'square', size }).base(),
                native.avatar({ shape: 'square', size }).base(),
            ]),
            web.orderList().dropZone(),
            web.pickList().dropZone(),
            ...sizes.flatMap((size) => [
                web.timeGrid({ size }).slot(),
                web.treeSelect({ size }).trigger(),
                web.treeSelect({ size }).chipsControl(),
                web.cascadeSelect({ size }).trigger(),
                web.cascadeSelect({ size }).searchControl(),
            ]),
        ];
        for (const value of classes)
            expect(value).toMatch(/(^| )rounded-(dialog|\[var\(--wc-[\w-]+-radius[\w-]*,[^)]+\)\])( |$)/);
    });

    it('React Native fields take the control corners like the web', () => {
        const sizes = ['sm', 'md', 'lg'] as const;
        const classes = [
            ...sizes.flatMap((size) => [
                native.input({ size }).base(),
                native.textarea({ size }),
                native.select({ size }).trigger(),
                native.durationInput({ size }).base(),
                native.timeGrid({ size }).slot(),
            ]),
            native.tagsInput().base(),
        ];
        for (const value of classes)
            expect(value).toMatch(/(^| )rounded-(dialog|\[var\(--wc-[\w-]+-radius[\w-]*,[^)]+\)\])( |$)/);
    });

    it('rounded-none of a fullscreen dialog replaces its corner variable', () => {
        expect(web.dialog({ fullscreen: true }).content()).not.toContain('rounded-dialog');
        expect(native.dialog({ fullscreen: true }).content()).not.toContain('rounded-dialog');
    });
});
