import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Knob, type KnobProps } from './Knob.js';

function Demo(args: KnobProps) {
    const [value, setValue] = useState(40);
    return <Knob {...args} value={value} onValueChange={setValue} formatValue={(v) => `${v}%`} />;
}

const meta = {
    title: 'Forms/Knob',
    component: Knob,
    args: { label: 'Volume', min: 0, max: 100, step: 1, size: 'md', disabled: false },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof Knob>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
    render: () => (
        <div className="flex items-end gap-6">
            <Knob label="Small" size="sm" defaultValue={20} />
            <Knob label="Temperature" min={10} max={30} step={0.5} defaultValue={21} formatValue={(v) => `${v} °C`} />
            <Knob label="Large" size="lg" defaultValue={80} />
        </div>
    ),
};

/** Text template, stroke width and color */
export const Styling: Story = {
    name: 'Styling',
    render: () => (
        <div className="flex items-end gap-6">
            <Knob label="Level" defaultValue={64} valueTemplate="{value} dB" strokeWidth={12} color="success" />
            <Knob label="Load" defaultValue={88} valueTemplate="{value}%" color="danger" strokeWidth={4} />
        </div>
    ),
};
