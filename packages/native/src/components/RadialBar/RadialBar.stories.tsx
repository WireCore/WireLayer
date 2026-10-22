import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { RadialBar } from './RadialBar.js';

const meta = {
    title: 'Data/RadialBar',
    component: RadialBar,
    args: {
        label: 'Goals this quarter',
        showTitle: true,
        items: [
            { label: 'Revenue', value: 82 },
            { label: 'New customers', value: 64 },
            { label: 'Satisfaction', value: 91 },
        ],
        size: 'md',
    },
    argTypes: { items: { control: false }, size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof RadialBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Rings inside each other; the legend with the values is the text */
export const Playground: Story = {};

export const OwnScale: Story = {
    name: 'Custom scale and values',
    args: {
        label: 'Storage',
        size: 'sm',
        items: [
            { label: 'Databases', value: 380, max: 500 },
            { label: 'Files', value: 120, max: 200, tone: 'warn' },
        ],
        formatValue: (value: number, max: number) => `${value} of ${max} GB`,
    },
};
