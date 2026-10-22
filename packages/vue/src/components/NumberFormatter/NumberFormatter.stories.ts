import type { Meta, StoryObj } from '@storybook/vue3-vite';
import NumberFormatter from './NumberFormatter.vue';

const meta = {
    title: 'Data/NumberFormatter',
    component: NumberFormatter,
    args: { value: 1234567.891 },
    render: (args) => ({
        components: { NumberFormatter },
        setup: () => ({ args }),
        template: `
            <dl class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
                <dt class="text-muted">Number</dt><dd><NumberFormatter :value="args.value" /></dd>
                <dt class="text-muted">Currency</dt>
                <dd><NumberFormatter :value="args.value" :format-options="{ style: 'currency', currency: 'EUR' }" /></dd>
                <dt class="text-muted">Percent</dt>
                <dd><NumberFormatter :value="0.284" :format-options="{ style: 'percent', maximumFractionDigits: 1 }" /></dd>
                <dt class="text-muted">Compact</dt>
                <dd><NumberFormatter :value="args.value" :format-options="{ notation: 'compact' }" /></dd>
                <dt class="text-muted">Unit</dt>
                <dd><NumberFormatter :value="512" :format-options="{ style: 'unit', unit: 'gigabyte' }" /></dd>
            </dl>`,
    }),
} satisfies Meta<typeof NumberFormatter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
