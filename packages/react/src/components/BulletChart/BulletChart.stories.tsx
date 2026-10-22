import type { Meta, StoryObj } from '@storybook/react-vite';
import { BulletChart } from './BulletChart.js';

const meta = {
    title: 'Data/BulletChart',
    component: BulletChart,
    args: { label: 'Revenue', description: 'k€', value: 270, target: 250, max: 300, ranges: [150, 225, 300] },
    parameters: { layout: 'padded' },
    render: (args) => <BulletChart {...args} className="max-w-xl" />,
} satisfies Meta<typeof BulletChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Value as a bar, target as a marker, poor/fair/good as shades – a meter with the values as text */
export const Playground: Story = {};

/** Several measures below each other */
export const Dashboard: Story = {
    render: () => (
        <div className="flex max-w-xl flex-col gap-4">
            <BulletChart label="Revenue" description="k€" value={270} target={250} max={300} ranges={[150, 225, 300]} />
            <BulletChart label="New customers" value={18} target={25} max={30} ranges={[10, 20, 30]} tone="info" />
            <BulletChart
                label="Satisfaction"
                description="Points"
                value={4.1}
                target={4.5}
                max={5}
                ranges={[3, 4, 5]}
                tone="success"
                formatValue={(value) => value.toLocaleString('en-US', { minimumFractionDigits: 1 })}
            />
        </div>
    ),
};
