import type { Meta, StoryObj } from '@storybook/react-vite';
import { RingProgress } from './RingProgress.js';

const meta = {
    title: 'Feedback/RingProgress',
    component: RingProgress,
    args: { value: 72, label: 'Storage', size: 'md', thickness: 10, roundCaps: true },
    argTypes: {
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        value: { control: { type: 'range', min: 0, max: 100 } },
    },
} satisfies Meta<typeof RingProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One value: a progress bar named by its label */
export const Playground: Story = {};

/** Several parts with a legend (text for every part); the middle shows the sum */
export const Segments: Story = {
    name: 'Segments',
    args: {
        value: undefined,
        size: 'lg',
        label: 'Storage (1 TB)',
        max: 1000,
        formatValue: (value: number, max: number) => `${Math.round((value / max) * 100)}%`,
        segments: [
            { value: 420, label: 'Databases' },
            { value: 260, label: 'Backups', color: 'success' },
            { value: 90, label: 'Logs', color: 'warn' },
        ],
    },
};

/** Own content in the middle (center) */
export const CustomCenter: Story = {
    name: 'Custom center',
    render: () => (
        <RingProgress
            value={18}
            max={24}
            label="Tasks done"
            size="lg"
            thickness={12}
            center={
                <>
                    <span className="text-2xl font-semibold">18</span>
                    <span className="text-xs text-muted">of 24</span>
                </>
            }
        />
    ),
};
