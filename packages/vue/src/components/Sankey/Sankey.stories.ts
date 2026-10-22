import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Sankey from './Sankey.vue';

const meta = {
    title: 'Data/Sankey',
    component: Sankey,
    args: {
        title: 'Visitor flow in October',
        height: 280,
        nodes: [
            { id: 'search', label: 'Search' },
            { id: 'ads', label: 'Ads' },
            { id: 'mail', label: 'Newsletter' },
            { id: 'shop', label: 'Shop' },
            { id: 'blog', label: 'Blog' },
            { id: 'order', label: 'Order' },
            { id: 'exit', label: 'Drop-off' },
        ],
        links: [
            { source: 'search', target: 'shop', value: 420 },
            { source: 'search', target: 'blog', value: 180 },
            { source: 'ads', target: 'shop', value: 260 },
            { source: 'mail', target: 'shop', value: 120 },
            { source: 'blog', target: 'shop', value: 90 },
            { source: 'shop', target: 'order', value: 310 },
            { source: 'shop', target: 'exit', value: 580 },
        ],
    },
    argTypes: {},
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { Sankey },
        setup: () => ({ args }),
        template: `
            <Sankey v-bind="args" class="max-w-3xl" />`,
    }),
} satisfies Meta<typeof Sankey>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
