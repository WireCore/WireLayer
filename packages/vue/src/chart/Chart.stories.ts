import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed, type ConcreteComponent } from 'vue';
import Chart from './Chart.vue';
import type { ChartOptions, ChartPlugin } from './index.js';

const quarters = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
        { label: '2025', data: [182, 204, 197, 241] },
        { label: '2026', data: [215, 238, 262, 280] },
    ],
};

const meta = {
    title: 'Data/Chart',
    // Generic component: Storybook's Vue types can't infer args here
    component: Chart as unknown as ConcreteComponent,
    args: { type: 'bar', data: quarters, title: 'Revenue by quarter (k€)', hideTitle: false, table: true },
    argTypes: {
        type: { control: 'inline-radio', options: ['bar', 'line'] },
        data: { control: false },
    },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { Chart: Chart as unknown as ConcreteComponent },
        setup: () => ({ args }),
        template: `<Chart v-bind="args" class="max-w-2xl" />`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

export const Line: Story = {
    args: {
        type: 'line',
        title: 'Active users per month',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{ label: 'Users', data: [1240, 1380, 1295, 1510, 1720, 1865], tension: 0.3, fill: true }],
        },
    },
};

export const Doughnut: Story = {
    args: {
        type: 'doughnut',
        title: 'Tickets by status',
        height: '16rem',
        data: {
            labels: ['Done', 'In progress', 'Waiting', 'Blocked'],
            datasets: [{ label: 'Tickets', data: [128, 42, 17, 6] }],
        },
        options: { plugins: { legend: { position: 'right' } } },
    },
};

/** Draws a dashed line at a value of the x axis (horizontal bars) – a plugin of its own chart only */
const targetLine = (target: number): ChartPlugin<'bar'> => ({
    id: 'targetLine',
    afterDatasetsDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        const x = scales.x!.getPixelForValue(target);
        ctx.save();
        ctx.strokeStyle = getComputedStyle(chart.canvas).color;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
        ctx.restore();
    },
});

/**
 * `plugins`: Chart.js plugins for this chart only – here a dashed target line. Options kept in a variable need their
 * type (`ChartOptions<'bar'>` from the same entry point), or literals such as `indexAxis: 'y'` become plain strings
 */
export const InlinePlugin: Story = {
    name: 'Inline plugin, typed options',
    render: () => ({
        components: { Chart: Chart as unknown as ConcreteComponent },
        setup: () => ({
            quarters,
            plugins: [targetLine(250)],
            // Typed: indexAxis stays 'y' (not string)
            options: computed<ChartOptions<'bar'>>(() => ({
                indexAxis: 'y',
                plugins: { legend: { position: 'bottom' } },
            })),
        }),
        template: `<Chart type="bar" :data="quarters" :options="options" :plugins="plugins" title="Revenue against the target of 250 k€" class="max-w-2xl" />`,
    }),
};
