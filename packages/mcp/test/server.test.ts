import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';
import { createServer } from '../src/server.js';
import { collect, stripMdx } from '../scripts/collect.ts';
import { vueName } from '../src/tools.js';

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
