import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { compileScript, parse, registerTS } from '@vue/compiler-sfc';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { createServer } from '../src/server.js';
import { collect, stripMdx } from '../scripts/collect.ts';
import { cssLlms, packageLlms } from '../scripts/render.ts';
import { vueName, vuePropName } from '../src/tools.js';

async function connect() {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await createServer().connect(serverSide);
    const client = new Client({ name: 'test', version: '0.0.0' });
    await client.connect(clientSide);
    return client;
}
const text = (result: Awaited<ReturnType<Client['callTool']>>) =>
    (result.content as { type: string; text: string }[]).map((part) => part.text).join('\n');

describe('MCP server', () => {
    it('offers the four tools', async () => {
        const client = await connect();
        expect(client.getServerVersion()?.name).toBe('wirelayer');
        const { tools } = await client.listTools();
        expect(tools.map((tool) => tool.name).sort()).toEqual([
            'get_component',
            'get_guide',
            'list_components',
            'search_components',
        ]);
    });

    it('describes a component with React and Vue names', async () => {
        const client = await connect();
        const result = text(await client.callTool({ name: 'get_component', arguments: { name: 'datatable' } }));
        expect(result).toContain("React: import { DataTable } from '@wirecore/wirelayer-react/data-table'");
        expect(result).toContain('filterDisplay? → filter-display');
        expect(result).toContain('onSortingChange? → v-model:sorting');
        expect(text(await client.callTool({ name: 'get_component', arguments: { name: 'Data' } }))).toContain(
            'Did you mean'
        );
    });

    it('describes the blocks with their own packages', async () => {
        const client = await connect();
        const result = text(await client.callTool({ name: 'get_component', arguments: { name: 'ConditionBuilder' } }));
        expect(result).toContain("React: import { ConditionBuilder } from '@wirecore/wirelayer-blocks-react'");
        expect(result).toContain("Vue: import { ConditionBuilder } from '@wirecore/wirelayer-blocks-vue'");
        expect(text(await client.callTool({ name: 'get_component', arguments: { name: 'SiteHeader' } }))).toContain(
            '@wirecore/wirelayer-blocks-react'
        );
    });

    it('finds components and guides', async () => {
        const client = await connect();
        expect(
            text(await client.callTool({ name: 'search_components', arguments: { query: 'calendar events' } }))
        ).toContain('Scheduler');
        expect(text(await client.callTool({ name: 'list_components', arguments: { category: 'Media' } }))).toContain(
            'Compare'
        );
        expect(text(await client.callTool({ name: 'get_guide', arguments: { topic: 'nuxt' } }))).toContain('# Nuxt');
    });
});

describe('React Native', () => {
    it('describes the React Native component and points to it from the web one', async () => {
        const client = await connect();
        const native = text(
            await client.callTool({ name: 'get_component', arguments: { name: 'Select', framework: 'native' } })
        );
        expect(native).toContain("Import: import { Select } from '@wirecore/wirelayer-native'");
        // Props of the shared option-list interface are listed, too
        expect(native).toContain('dataSource?: DataSource<T>');
        expect(native).toContain('Storybook: ?path=/story/native_forms-select--playground');
        const web = text(await client.callTool({ name: 'get_component', arguments: { name: 'Select' } }));
        expect(web).toContain("React Native: import { Select } from '@wirecore/wirelayer-native'");
        expect(
            text(
                await client.callTool({ name: 'get_component', arguments: { name: 'FormField', framework: 'native' } })
            )
        ).toContain("'@wirecore/wirelayer-native/form'");
        expect(
            text(
                await client.callTool({
                    name: 'list_components',
                    arguments: { category: 'Forms', framework: 'native' },
                })
            )
        ).toContain('PinInput (Forms, @wirecore/wirelayer-native)');
        expect(
            text(
                await client.callTool({ name: 'get_component', arguments: { name: 'DataTable', framework: 'native' } })
            )
        ).toContain("'@wirecore/wirelayer-native/data-table'");
    });

    it('collects functions declared in the subpath files themselves', () => {
        const functions = collect().native.functions.map((fn) => `${fn.name} ${fn.subpath}`);
        expect(functions).toContain('useClipboard /expo-clipboard');
        expect(functions).toContain('documentPicker /expo-document-picker');
        expect(functions).toContain('shareFile /expo-sharing');
    });

    it('follows `export *` to the web hooks', () => {
        const functions = collect().functions.map((fn) => fn.name);
        expect(functions).toContain('useDisclosure');
        expect(functions).toContain('useLocalStorage');
    });
});

describe('vueName', () => {
    it('maps React props to Vue', () => {
        expect(vueName('value', ['value', 'onValueChange'])).toBe('v-model (modelValue)');
        expect(vueName('onValueChange', ['value', 'onValueChange'])).toBe('v-model');
        expect(vueName('onRowReorder', [])).toBe('@row-reorder');
        expect(vueName('className', [])).toBe('class');
    });
});

describe('stripMdx', () => {
    it('drops MDX imports but keeps imports in code blocks', () => {
        const page = [
            "import { Meta } from '@storybook/addon-docs/blocks';",
            '<Meta title="Getting started" />',
            '## Vue',
            '```ts',
            "import { Button } from '@wirecore/wirelayer-vue';",
            '```',
            '<Divider />',
        ].join('\n');
        expect(stripMdx(page)).toBe(
            ['## Vue', '```ts', "import { Button } from '@wirecore/wirelayer-vue';", '```'].join('\n')
        );
    });
});

describe('Vue slots and events', () => {
    const data = collect();
    const vueOf = (name: string) => data.components.find((component) => component.name === name)?.vue;

    it('are read from defineSlots and defineEmits, with their doc comments', () => {
        const multiSelect = vueOf('MultiSelect')!;
        expect(multiSelect.slots.find((slot) => slot.name === 'item')?.props).toBe('{ item: T } & ListItemState');
        expect(multiSelect.events.find((event) => event.name === 'filterChange')).toMatchObject({
            payload: 'text: string',
            description: expect.stringContaining('search field'),
        });
        // Slots by column id (index signatures) and v-model from defineModel
        expect(vueOf('DataTable')!.slots.map((slot) => slot.name)).toContain('cell-<id>');
        expect(vueOf('Input')!.events).toEqual([
            { name: 'update:modelValue', payload: 'value: string', description: '' },
        ]);
    });

    it('get_component lists them in the Vue terms', async () => {
        const result = text(await (await connect()).callTool({ name: 'get_component', arguments: { name: 'Menu' } }));
        expect(result).toContain('- v-model:open: open: boolean');
        expect(result).toContain('- #item: { item: MenuItem | MenuCheckboxItem | MenuRadioItem }');
    });
});

describe('llms.txt of the packages', () => {
    const data = collect();
    // The guides at the end are shared and show both frameworks
    const api = (full: string) => full.slice(0, full.indexOf('\n## Guides'));

    it('Vue: imports, props, events and slots in Vue syntax, no React', () => {
        const { index, full } = packageLlms(data, 'vue');
        expect(index).toContain('# WireLayer for Vue 3 (@wirecore/wirelayer-vue)');
        expect(full).toContain("- Import: `import { MultiSelect } from '@wirecore/wirelayer-vue'`");
        expect(full).toContain('| v-model? (modelValue) | `V[]` |');
        expect(full).toContain('| @filter-change | `text: string` |');
        expect(full).toContain('| #item | `{ item: T } & ListItemState` |');
        expect(full).toContain('https://wirecore.github.io/WireLayer/?path=/story/vue_');
        expect(full).toContain('`bindInput` (`@wirecore/wirelayer-vue/form`)');
        expect(api(full)).not.toContain('@wirecore/wirelayer-react');
        // Callbacks and content props are events and slots in Vue
        expect(full).not.toMatch(/\| on[A-Z]\w*\?? \|/);
    });

    it('Vue: the props of the Vue components themselves – also where React has another type', () => {
        const { full } = packageLlms(data, 'vue');
        const section = (name: string) => full.slice(full.indexOf(`### ${name}\n`)).split('\n### ')[0]!;
        // Card and Field take strings and slots in Vue, ReactNode in React
        expect(section('Card')).toContain('| title? | `string` |');
        expect(section('Field')).toContain('| helper-text? | `string` |');
        expect(section('Field')).toContain('| error? | `string` |');
        expect(section('Field')).toContain('| #helper-text |');
        // A slot declared with defineSlots, not a ReactNode prop
        expect(section('DialogContent')).toContain('| #footer |');
        expect(section('DialogContent')).not.toContain('| footer? |');
        expect(section('DataTable')).toContain('| v-model:selected-rows? |');
    });

    // Independent of the collector: Vue's own compiler names the props of every component
    it('Vue: every prop of every component is listed', () => {
        registerTS(() => ts);
        const root = fileURLToPath(new URL('../../..', import.meta.url));
        const vueFiles = new Map<string, string>();
        const walk = (directory: string) => {
            for (const entry of readdirSync(directory, { withFileTypes: true })) {
                const path = join(directory, entry.name);
                if (entry.isDirectory()) walk(path);
                else if (entry.name.endsWith('.vue') && !vueFiles.has(entry.name)) vueFiles.set(entry.name, path);
            }
        };
        walk(join(root, 'packages/vue/src'));
        walk(join(root, 'packages/blocks-vue/src'));
        const fs = { fileExists: existsSync, readFile: (path: string) => readFileSync(path, 'utf8') };
        const { full } = packageLlms(data, 'vue');
        const missing: string[] = [];
        for (const component of data.components) {
            const path = vueFiles.get(`${component.name}.vue`);
            const source = path && readFileSync(path, 'utf8');
            if (!source?.includes('defineProps')) continue;
            const { descriptor } = parse(source, { filename: path });
            const bindings = compileScript(descriptor, { id: component.name, fs }).bindings ?? {};
            const section = full.slice(full.indexOf(`### ${component.name}\n`)).split('\n### ')[0]!;
            const events = component.vue?.events.map((event) => event.name) ?? [];
            // "v-model (modelValue)" is listed as "v-model? (modelValue)" when optional
            const row = (prop: string) => `| ${vuePropName(prop, events).replace(/^\S+/, (name) => `${name}?`)}`;
            for (const [prop, kind] of Object.entries(bindings))
                if (
                    kind === 'props' &&
                    !section.includes(`| ${vuePropName(prop, events)} |`) &&
                    !section.includes(row(prop))
                )
                    missing.push(`${component.name}.${prop}`);
        }
        expect(missing).toEqual([]);
    });

    it('Vue: every named <slot> is declared with defineSlots (the docs read it)', () => {
        const root = fileURLToPath(new URL('../../..', import.meta.url));
        const undeclared: string[] = [];
        const walk = (directory: string) => {
            for (const entry of readdirSync(directory, { withFileTypes: true })) {
                const path = join(directory, entry.name);
                if (entry.isDirectory()) walk(path);
                else if (entry.name.endsWith('.vue')) {
                    const source = readFileSync(path, 'utf8');
                    const template = source.split('<template>')[1] ?? '';
                    const declared = source.match(/defineSlots<([\s\S]*?)>\(\)/)?.[1] ?? '';
                    for (const [, name] of template.matchAll(/<slot\s+name="([^"]+)"/g))
                        if (!new RegExp(`['\\s{;]${name}'?\\??[(:]`).test(declared))
                            undeclared.push(`${entry.name} #${name}`);
                }
            }
        };
        walk(join(root, 'packages/vue/src/components'));
        walk(join(root, 'packages/blocks-vue/src'));
        expect(undeclared).toEqual([]);
    });

    it('React and React Native: their own imports only', () => {
        const react = packageLlms(data, 'react');
        expect(react.full).toContain("- Import: `import { MultiSelect } from '@wirecore/wirelayer-react'`");
        expect(react.full).toContain('| onFilterChange? |');
        expect(api(react.full)).not.toContain('@wirecore/wirelayer-vue');
        const native = packageLlms(data, 'native');
        expect(native.index).toContain('# WireLayer for React Native (@wirecore/wirelayer-native)');
        expect(native.full).toContain("Import: `import { Select } from '@wirecore/wirelayer-native'`");
        expect(api(native.full)).not.toContain('@wirecore/wirelayer-vue');
    });

    it('HTML: the class reference with defaults and the guide', () => {
        const { index, full } = cssLlms(
            [
                {
                    name: 'button',
                    base: 'wc-button',
                    slots: [{ slot: 'icon', class: 'wc-button-icon' }],
                    variants: [
                        {
                            variant: 'size',
                            values: [
                                { value: 'sm', class: 'wc-button-sm', default: false },
                                { value: 'md', class: 'wc-button-md', default: true },
                            ],
                        },
                    ],
                },
            ],
            '# Guide\n\nUse the classes.',
            data
        );
        expect(index).toContain('- `.wc-button` (parts: .wc-button-icon)');
        expect(full).toContain('- size: `.wc-button-sm`, `.wc-button-md` (default, no class needed)');
        expect(full).toContain('Use the classes.');
    });
});
