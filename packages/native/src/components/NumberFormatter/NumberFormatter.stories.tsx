import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { NumberFormatter } from './NumberFormatter.js';

const meta = {
    title: 'Data/NumberFormatter',
    component: NumberFormatter,
    args: { value: 1234567.891, formatOptions: { style: 'currency', currency: 'EUR' } },
} satisfies Meta<typeof NumberFormatter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
