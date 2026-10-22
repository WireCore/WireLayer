import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import BarChart from './BarChart.vue';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const revenue = months.map((month, index) => ({
    month,
    web: 120 + index * 9 + (index % 3) * 14,
    hosting: 60 + index * 4,
    margin: 18 + (index % 4) * 2,
}));
const euro = (value: number) => `€${value.toLocaleString('en-US')}k`;

const meta = {
    title: 'Data/BarChart',
    component: BarChart,
    args: {
        title: 'Revenue by month',
        categoryKey: 'month',
        data: revenue,
        series: [
            { key: 'web', label: 'Software & Web' },
            { key: 'hosting', label: 'Hosting', tone: 'info' },
        ],
        formatValue: euro,
        horizontal: false,
        stacked: false,
    },
    argTypes: { data: { control: false }, series: { control: false } },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { BarChart },
        setup: () => ({ args }),
        template: `<BarChart v-bind="args" class="max-w-3xl" />`,
    }),
} satisfies Meta<typeof BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Grouped bars from rows of data; values formatted in axis, tooltip and table */
export const Playground: Story = {};

/** Stacked and horizontal */
export const Stacked: Story = { args: { stacked: true, horizontal: true, height: '28rem' } };

/** A target line and a corridor (own Chart.js plugin) – also listed as text below the chart */
export const References: Story = {
    args: {
        references: [
            { value: 200, label: 'Target', tone: 'success' },
            { from: 120, to: 160, label: 'Corridor', tone: 'warn' },
        ],
    },
};

/** Margin in percent on a second axis */
export const SecondAxis: Story = {
    args: {
        series: [
            { key: 'web', label: 'Software & Web' },
            { key: 'margin', label: 'Margin', axis: 'end', tone: 'success' },
        ],
        formatValue: undefined,
    },
};

/** A small overview below selects the range – with the slider's arrow keys, too */
export const Range: Story = {
    render: () => ({
        components: { BarChart },
        setup: () => ({ range: ref<[number, number]>([3, 8]), revenue, months, euro }),
        template: `
            <div class="flex max-w-3xl flex-col gap-2">
                <BarChart
                    v-model:range="range"
                    title="Revenue by month"
                    category-key="month"
                    :data="revenue"
                    :series="[{ key: 'web', label: 'Software & Web' }]"
                    :format-value="euro"
                    brush
                />
                <span class="text-xs text-muted">Selection: {{ months[range[0]] }} to {{ months[range[1]] }}</span>
            </div>`,
    }),
};
