import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AngleSlider, type AngleSliderProps } from './AngleSlider.js';

function Demo(args: AngleSliderProps) {
    const [value, setValue] = useState(45);
    return <AngleSlider {...args} value={value} onValueChange={setValue} />;
}

const meta = {
    title: 'Forms/AngleSlider',
    component: AngleSlider,
    args: { label: 'Wind direction', step: 1, marks: [0, 90, 180, 270], showValue: true, disabled: false },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof AngleSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 0–360°: arrow keys change it (Shift: in tens), Home/End; drag anywhere on the dial */
export const Playground: Story = {};

/** Steps of 15°, own text */
export const Steps: Story = {
    name: 'Steps',
    args: {
        label: 'Rotation',
        step: 15,
        marks: [0, 45, 90, 135, 180, 225, 270, 315],
        formatValue: (degrees: number) => `${degrees} °`,
    },
};
