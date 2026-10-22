import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadialBar } from './RadialBar.js';

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
    render: (args) => <RadialBar {...args} />,
} satisfies Meta<typeof RadialBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One ring per value; the legend with the values is the text */
export const Playground: Story = {};
