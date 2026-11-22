import type { Meta, StoryObj } from '@storybook/react-vite';
import { Countdown } from './Countdown.js';

const meta = {
    title: 'Data/Countdown',
    component: Countdown,
    args: {
        target: '2026-12-24T18:00:00',
        label: 'Until Christmas Eve',
        variant: 'boxed',
        size: 'md',
    },
    argTypes: {
        variant: { control: 'inline-radio', options: ['boxed', 'plain'] },
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        format: { control: 'inline-radio', options: ['units', 'clock'] },
    },
} satisfies Meta<typeof Countdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Without days – the hours take everything above (e.g. 49 hours) */
export const HoursOnly: Story = {
    args: {
        target: '2026-10-22T11:30:00',
        label: 'Maintenance starts in',
        units: ['hours', 'minutes', 'seconds'],
        variant: 'plain',
    },
};

/** `format="clock"`: "05:12:33" – the units stay for screen readers */
export const Clock: Story = {
    args: {
        target: '2026-10-22T11:30:00',
        label: 'Protest time ends in',
        units: ['hours', 'minutes', 'seconds'],
        format: 'clock',
    },
};
