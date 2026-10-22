import type { Meta, StoryObj } from '@storybook/vue3-vite';
import BarsList from './BarsList.vue';

const meta = {
    title: 'Data/BarsList',
    component: BarsList,
    args: {
        label: 'Most visited pages',
        showTitle: true,
        labelHeader: 'Page',
        valueHeader: 'Views',
        items: [
            { label: '/start', value: 12840, href: '#start' },
            { label: '/pricing', value: 8310, href: '#pricing' },
            { label: '/blog/release-2-4', value: 5120 },
            { label: '/contact', value: 2210 },
            { label: '/careers', value: 940, tone: 'success' },
        ],
    },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { BarsList },
        setup: () => ({ args }),
        template: `<BarsList v-bind="args" class="max-w-md" />`,
    }),
} satisfies Meta<typeof BarsList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A list with values – the bars behind the labels show the size (no chart library) */
export const Playground: Story = {};
