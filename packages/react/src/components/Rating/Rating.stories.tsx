import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import { Rating, type RatingProps } from './Rating.js';

function Demo(args: RatingProps) {
    const [value, setValue] = useState(4);
    return (
        <div className="flex flex-col gap-3">
            <Rating {...args} value={value} onValueChange={setValue} />
            <span className="text-xs text-muted">Value: {value}</span>
        </div>
    );
}

const meta = {
    title: 'Forms/Rating',
    component: Rating,
    args: {
        label: 'How satisfied are you?',
        count: 5,
        allowHalf: false,
        readOnly: false,
        disabled: false,
        size: 'md',
    },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof Rating>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ReadOnly: Story = {
    render: () => <Rating aria-label="Average rating" defaultValue={3.5} allowHalf readOnly size="sm" />,
};

function ClearDemo() {
    const [value, setValue] = useState(3);
    return (
        <div className="flex flex-col gap-3">
            <Rating value={value} onValueChange={setValue} label="How do you like it?" allowClear icon={Heart} />
            <span className="text-xs text-muted">Value: {value}</span>
        </div>
    );
}

/** Clicking the chosen star again (or Delete) clears the rating; own symbol instead of the star */
export const ClearAndOwnIcon: Story = { render: () => <ClearDemo /> };
