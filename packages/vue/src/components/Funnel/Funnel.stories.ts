import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Funnel from './Funnel.vue';

const meta = {
    title: 'Data/Funnel',
    component: Funnel,
    args: {
        title: 'Orders in October',
        stages: [
            { label: 'Visits', value: 18400 },
            { label: 'Product page', value: 7350 },
            { label: 'Cart', value: 2100 },
            { label: 'Checkout', value: 1240 },
            { label: 'Ordered', value: 860 },
        ],
        conversion: true,
        table: true,
        tone: 'primary',
    },
    argTypes: { tone: { control: 'inline-radio', options: ['primary', 'info', 'success', 'warn', 'danger'] } },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { Funnel },
        setup: () => ({ args }),
        template: `<Funnel v-bind="args" class="max-w-2xl" />`,
    }),
} satisfies Meta<typeof Funnel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Stages narrowing with the value, the conversion between them; the table is the text alternative */
export const Playground: Story = {};
