import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from './Spinner.js';

const meta = {
    title: 'Feedback/Spinner',
    component: Spinner,
    args: { size: 'lg', label: 'Loading' },
    argTypes: {
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A fixed value: the ring fills up (a progress bar) */
export const WithValue: Story = { name: 'With value', args: { value: 40, label: 'Export' } };
