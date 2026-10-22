import type { Meta, StoryObj } from '@storybook/vue3-vite';
import PieChart from './PieChart.vue';

const meta = {
    title: 'Data/PieChart',
    component: PieChart,
    args: {
        title: 'Tickets by status',
        donut: true,
        slices: [
            { label: 'Done', value: 128, tone: 'success' },
            { label: 'In progress', value: 42 },
            { label: 'Waiting', value: 17, tone: 'warn' },
            { label: 'Blocked', value: 6, tone: 'danger' },
        ],
    },
    argTypes: { slices: { control: false } },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { PieChart },
        setup: () => ({ args }),
        template: `<PieChart v-bind="args" class="max-w-xl" />`,
    }),
} satisfies Meta<typeof PieChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Doughnut with a legend of values and shares beside it */
export const Playground: Story = {};

/** A full pie */
export const Pie: Story = { args: { donut: false } };
