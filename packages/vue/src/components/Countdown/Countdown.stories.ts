import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Countdown from './Countdown.vue';

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
