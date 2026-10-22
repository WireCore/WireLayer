import type { Meta, StoryObj } from '@storybook/vue3-vite';
import CompositeChart from './CompositeChart.vue';

const meta = {
    title: 'Data/CompositeChart',
    component: CompositeChart,
    args: {
        title: 'Revenue and margin',
        categoryKey: 'q',
        data: [
            { q: 'Q1', revenue: 182, margin: 14 },
            { q: 'Q2', revenue: 204, margin: 17 },
            { q: 'Q3', revenue: 197, margin: 12 },
            { q: 'Q4', revenue: 241, margin: 19 },
        ],
        series: [
            { key: 'revenue', label: 'Revenue (k€)' },
            { key: 'margin', label: 'Margin (%)', type: 'line', axis: 'end', tone: 'success' },
        ],
    },
    argTypes: { data: { control: false }, series: { control: false } },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { CompositeChart },
        setup: () => ({ args }),
        template: `<CompositeChart v-bind="args" class="max-w-3xl" />`,
    }),
} satisfies Meta<typeof CompositeChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Bars and a line on a second axis in one chart */
export const Playground: Story = {};
