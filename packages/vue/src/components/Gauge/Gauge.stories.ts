import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Gauge from './Gauge.vue';

const meta = {
    title: 'Data/Gauge',
    component: Gauge,
    args: {
        value: 82,
        label: 'CPU load',
        size: 'md',
        thresholds: [
            { from: 70, status: 'warn' },
            { from: 90, status: 'danger' },
        ],
        formatOptions: { style: 'unit', unit: 'percent' },
    },
    argTypes: {
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        value: { control: { type: 'range', min: 0, max: 100 } },
    },
    render: (args) => ({
        components: { Gauge },
        setup: () => ({ args }),
        template: `
            <div class="flex flex-wrap items-end gap-8">
                <Gauge v-bind="args" />
                <Gauge :value="38" label="Memory" status="success" :format-options="{ style: 'unit', unit: 'percent' }" />
                <Gauge :value="2.4" :max="10" label="Response time (s)" size="sm" />
            </div>`,
    }),
} satisfies Meta<typeof Gauge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
