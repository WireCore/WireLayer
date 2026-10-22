import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { CodeHighlight } from './CodeHighlight.js';

const server = `import { createServer } from 'node:http';

// Responds to every request with the status
const server = createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ status: 'ok', path: request.url }));
});

server.listen(8080);`;

const patch = `--- a/config.yaml
+++ b/config.yaml
 name: customer-portal
-replicas: 2
+replicas: 3
 region: eu-central`;

const meta = {
    title: 'Data/CodeHighlight',
    component: CodeHighlight,
    args: { code: server, fileName: 'server.ts', lineNumbers: true },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
    parameters: {
        docs: {
            description: {
                component:
                    'Import from `@wirecore/wirelayer-native/code` with `shiki` as an optional peer dependency: `shiki/core` with the ' +
                    'JavaScript RegExp engine (no WebAssembly, no native module). Until Shiki has loaded – or when a ' +
                    'grammar does not run in the JavaScript engine of the device – the code appears uncolored. Copying goes through ' +
                    '`onCopy` (e.g. `useClipboard` from `@wirecore/wirelayer-native/expo-clipboard`).',
            },
        },
    },
} satisfies Meta<typeof CodeHighlight>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Marked lines and a button that wraps long lines */
export const Highlighted: Story = { name: 'Highlighted lines', args: { highlightLines: [4, 5, 6], wrapToggle: true } };

/** A patch: "+" lines added, "-" lines removed */
export const Diff: Story = {
    name: 'Changes',
    args: { code: patch, fileName: 'config.yaml', diff: true, language: 'diff' },
};

/** Cut off after 120 dp – a button shows all of it */
export const Expandable: Story = { name: 'Expandable', args: { maxHeight: 120, expandable: true } };
