import type { Meta, StoryObj } from '@storybook/react-vite';
import { MeterGroup } from './MeterGroup.js';

const meta = {
    title: 'Data/MeterGroup',
    component: MeterGroup,
    args: {
        label: 'Storage (1 TB)',
        max: 1000,
        items: [
            { label: 'Databases', value: 420 },
            { label: 'Backups', value: 260 },
            { label: 'Logs', value: 90 },
        ],
        className: 'max-w-md',
    },
    argTypes: { items: { control: false } },
} satisfies Meta<typeof MeterGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Vertical bar, the legend next to it, one entry per line */
export const Vertical: Story = { name: 'Vertical', args: { orientation: 'vertical', legendOrientation: 'vertical' } };

/** Legend before the bar */
export const LegendFirst: Story = {
    name: 'Legend first',
    args: { legendPosition: 'start', legendOrientation: 'vertical' },
};
