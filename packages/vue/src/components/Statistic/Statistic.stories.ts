import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Euro, Server, Users } from '@lucide/vue';
import { ref } from 'vue';
import Button from '../Button/Button.vue';
import Statistic from './Statistic.vue';

const meta = {
    title: 'Data/Statistic',
    component: Statistic,
    args: {
        label: 'Revenue',
        value: 48250,
        formatOptions: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
        trend: 12,
        trendLabel: 'vs. previous month',
        bordered: true,
    },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
    render: (args) => ({
        components: { Statistic },
        setup: () => ({ args, Euro }),
        template: `<Statistic v-bind="args" :icon="Euro" class="w-72" />`,
    }),
} satisfies Meta<typeof Statistic>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Value with currency format, trend as arrow and text (the colour only adds to it) */
export const Playground: Story = {};

/** A row of key figures: unit, prefix/suffix, falling is good (error rate), no change */
export const KeyFigures: Story = {
    name: 'Key figures',
    render: () => ({
        components: { Statistic },
        setup: () => ({ Users, Server }),
        template: `
            <div class="grid w-[720px] gap-4 sm:grid-cols-3">
                <Statistic label="Active users" :value="1284" :trend="4.2" trend-label="since yesterday" :icon="Users" bordered />
                <Statistic label="Error rate" :value="0.8" unit="percent" :trend="-12" invert-trend trend-label="fewer errors" bordered />
                <Statistic label="Server" :value="42" suffix="online" :trend="0" trend-label="unchanged" :icon="Server" bordered />
            </div>`,
    }),
};

/** A small chart below the value (#chart slot), e.g. a Sparkline */
export const WithChart: Story = {
    name: 'With chart',
    render: () => ({
        components: { Statistic },
        template: `
            <Statistic label="Requests per minute" :value="312" :trend="8" trend-label="last hour" bordered class="w-72">
                <template #chart>
                    <svg viewBox="0 0 120 40" class="size-full text-primary" aria-hidden="true">
                        <polyline points="0,32 20,28 40,30 60,18 80,22 100,10 120,12" fill="none" stroke="currentColor" stroke-width="2" />
                    </svg>
                </template>
            </Statistic>`,
    }),
};

/** While the value loads: placeholder and aria-busy */
export const Loading: Story = { name: 'Loading', args: { value: null, loading: true, trend: undefined } };

/**
 * Counts up to the new value (only without reduced motion); screen readers get the final value at once. `live`
 * announces changes
 */
export const Animated: Story = {
    name: 'Animated',
    render: () => ({
        components: { Button, Statistic },
        setup() {
            const value = ref(1200);
            return { value, update: () => (value.value += Math.round(Math.random() * 400)) };
        },
        template: `
            <div class="flex flex-col items-start gap-3">
                <Statistic label="Orders today" :value="value" animate live bordered class="w-72" />
                <Button variant="outline" size="sm" @click="update">Refresh</Button>
            </div>`,
    }),
};
