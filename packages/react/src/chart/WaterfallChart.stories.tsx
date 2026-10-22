import type { Meta, StoryObj } from '@storybook/react-vite';
import { WaterfallChart } from './WaterfallChart.js';

const meta = {
    title: 'Data/WaterfallChart',
    component: WaterfallChart,
    args: {
        title: 'From revenue to profit (k€)',
        steps: [
            { label: 'Revenue', value: 840 },
            { label: 'Materials', value: -260 },
            { label: 'Personnel', value: -310 },
            { label: 'Gross profit', total: true },
            { label: 'Other', value: 45 },
            { label: 'Taxes', value: -72 },
            { label: 'Profit', total: true },
        ],
    },
    argTypes: { steps: { control: false } },
    parameters: { layout: 'padded' },
    render: (args) => <WaterfallChart {...args} className="max-w-3xl" />,
} satisfies Meta<typeof WaterfallChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Changes as floating bars, sums from zero; the table lists change and running sum */
export const Playground: Story = {};
