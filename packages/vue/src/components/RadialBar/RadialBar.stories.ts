import type { Meta, StoryObj } from '@storybook/vue3-vite';
import RadialBar from './RadialBar.vue';

const meta = {
    title: 'Data/RadialBar',
    component: RadialBar,
    args: {
        label: 'Quarterly goals',
        showTitle: true,
        size: 'md',
        items: [
            { label: 'Revenue', value: 82 },
            { label: 'New customers', value: 64 },
            { label: 'Tickets resolved', value: 91 },
        ],
    },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { RadialBar },
        setup: () => ({ args }),
        template: `<RadialBar v-bind="args" />`,
    }),
} satisfies Meta<typeof RadialBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One ring per value; the legend with the values is the text */
export const Playground: Story = {};
