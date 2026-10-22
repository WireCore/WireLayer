import type { Meta, StoryObj } from '@storybook/vue3-vite';
import JsonViewer from './JsonViewer.vue';

const server = {
    id: 'web-01',
    region: 'eu-central',
    online: true,
    load: 0.42,
    owner: null,
    tags: ['prod', 'frontend'],
    disks: [
        { name: 'system', size: 120, encrypted: true },
        { name: 'data', size: 2048, encrypted: false },
    ],
    contact: { team: 'Platform', mail: 'platform@example.com' },
};

const meta = {
    title: 'Data/JsonViewer',
    component: JsonViewer,
    args: { data: server, defaultExpandedDepth: 1, search: true, copyable: true, showTypes: false },
    render: (args) => ({
        components: { JsonViewer },
        setup: () => ({ args }),
        template: `<JsonViewer v-bind="args" class="w-[440px]" />`,
    }),
} satisfies Meta<typeof JsonViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Tree with arrow keys; values coloured by type and readable as text; Ctrl+C copies the focused value */
export const Playground: Story = {};

/** All open, the types written out */
export const WithTypes: Story = {
    name: 'With types',
    args: { defaultExpandedDepth: Infinity, showTypes: true, search: false },
};
