import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Sparkline from './Sparkline.vue';

const meta = {
    title: 'Data/Sparkline',
    component: Sparkline,
    args: {
        data: [42, 38, 45, 51, 49, 63, 58, 71, 66, 74, 69, 81],
        label: 'Utilization over the last 12 hours in percent',
        fill: true,
        width: '10rem',
        height: '2.5rem',
    },
    argTypes: { data: { control: false } },
    render: (args) => ({
        components: { Sparkline },
        setup: () => ({ args }),
        template: `
            <div class="flex items-center gap-4 rounded-xl border border-line bg-card p-4">
                <div class="flex flex-col"><span class="text-xs text-muted">CPU</span><span class="text-xl font-semibold">81%</span></div>
                <Sparkline v-bind="args" />
            </div>`,
    }),
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
