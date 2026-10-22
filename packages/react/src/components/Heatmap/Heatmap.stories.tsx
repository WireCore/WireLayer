import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heatmap } from './Heatmap.js';

const meta = {
    title: 'Data/Heatmap',
    component: Heatmap,
    args: {
        caption: 'Requests per hour',
        rows: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        columns: ['08', '10', '12', '14', '16', '18'],
        values: [
            [12, 48, 61, 55, 40, 9],
            [15, 52, 70, 62, 44, 11],
            [10, 45, 58, null, 39, 8],
            [18, 60, 80, 74, 51, 14],
            [9, 31, 42, 35, 20, 4],
        ],
        showValues: true,
        legend: true,
    },
    argTypes: {},
    render: (args) => <Heatmap {...args} />,
} satisfies Meta<typeof Heatmap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
