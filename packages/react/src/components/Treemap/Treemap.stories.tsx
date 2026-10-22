import type { Meta, StoryObj } from '@storybook/react-vite';
import { Treemap } from './Treemap.js';

const meta = {
    title: 'Data/Treemap',
    component: Treemap,
    args: {
        label: 'Storage by project',
        showTitle: true,
        height: '320px',
        items: [
            { label: 'Customer portal', value: 420 },
            { label: 'Intranet', value: 180 },
            { label: 'Archive', value: 160 },
            { label: 'Backups', value: 120 },
            { label: 'Logs', value: 60, tone: 'warn' },
            { label: 'Tests', value: 25 },
        ],
        formatOptions: { style: 'unit', unit: 'gigabyte' },
    },
    argTypes: {},
    parameters: { layout: 'padded' },
    render: (args) => <Treemap {...args} className="max-w-2xl" />,
} satisfies Meta<typeof Treemap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
