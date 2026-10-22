import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Countdown } from './Countdown.js';

const meta = {
    title: 'Data/Countdown',
    component: Countdown,
    args: {
        target: new Date(Date.now() + ((2 * 24 + 5) * 3600 + 42 * 60) * 1000),
        label: 'Until the maintenance window',
    },
    argTypes: {
        variant: { control: 'inline-radio', options: ['boxed', 'plain'] },
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    },
} satisfies Meta<typeof Countdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const HoursMinutes: Story = {
    name: 'Hours and minutes',
    args: { units: ['hours', 'minutes'], variant: 'plain', size: 'lg' },
};
