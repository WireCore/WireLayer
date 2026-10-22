import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './Progress.js';

const meta = {
    title: 'Feedback/Progress',
    component: Progress,
    args: { value: 68, max: 100, label: 'BUILD', showValue: true, className: 'w-[380px]' },
    argTypes: { value: { control: { type: 'range', min: 0, max: 100 } } },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Several parts in one bar, named in the legend (tooltip on the part) */
export const Segments: Story = {
    name: 'Segments',
    args: {
        value: 0,
        label: 'Storage',
        segments: [
            { value: 42, label: 'Databases', tooltip: '420 GB' },
            { value: 26, label: 'Backups', color: 'success', tooltip: '260 GB' },
            { value: 9, label: 'Logs', color: 'warn', tooltip: '90 GB' },
        ],
    },
};

/** Steps as blocks */
export const Steps: Story = {
    name: 'Steps',
    args: { value: 3, max: 5, steps: 5, label: 'Step 3 of 5', showValue: false },
};

/** Stripes, moving (only without reduced motion) */
export const Striped: Story = {
    name: 'Striped',
    args: { value: 55, label: 'Upload', striped: true, animated: true },
};

/** Vertical bars */
export const Vertical: Story = {
    name: 'Vertical',
    render: () => (
        <div className="flex h-40 gap-8">
            <Progress value={70} label="CPU" orientation="vertical" />
            <Progress value={35} label="RAM" orientation="vertical" striped />
        </div>
    ),
};
