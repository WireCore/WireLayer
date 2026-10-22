import type { Meta, StoryObj } from '@storybook/vue3-vite';
import LineChart from './LineChart.vue';

const weeks = Array.from({ length: 12 }, (_, index) => ({
    week: `Week ${index + 30}`,
    users: 1200 + index * 85 + (index % 3) * 60,
    plan: 1300 + index * 70,
}));

const meta = {
    title: 'Data/LineChart',
    component: LineChart,
    args: {
        title: 'Active users',
        categoryKey: 'week',
        data: weeks,
        series: [
            { key: 'users', label: 'Users' },
            { key: 'plan', label: 'Plan', tone: 'muted', dashed: true },
        ],
        curved: true,
        area: false,
    },
    argTypes: { data: { control: false }, series: { control: false } },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { LineChart },
        setup: () => ({ args }),
        template: `<LineChart v-bind="args" class="max-w-3xl" />`,
    }),
} satisfies Meta<typeof LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Lines with a dashed plan */
export const Playground: Story = {};

/** Stacked areas */
export const Areas: Story = {
    args: {
        area: true,
        stacked: true,
        series: [
            { key: 'users', label: 'Users' },
            { key: 'plan', label: 'Plan', tone: 'info' },
        ],
    },
};

/** Logarithmic axis for values over several orders of magnitude */
export const Logarithmic: Story = {
    args: {
        title: 'Requests per day',
        scale: 'logarithmic',
        categoryKey: 'day',
        data: [
            { day: 'Mon', value: 12 },
            { day: 'Tue', value: 140 },
            { day: 'Wed', value: 1900 },
            { day: 'Thu', value: 24000 },
            { day: 'Fri', value: 310000 },
        ],
        series: [{ key: 'value', label: 'Requests' }],
    },
};
