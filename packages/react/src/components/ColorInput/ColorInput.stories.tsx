import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { ColorInput, type ColorInputProps } from './ColorInput.js';

const swatches = ['#0a0a0a', '#1e66f5', '#7c3aed', '#0d9488', '#16a34a', '#d97706', '#dc2626', '#f4f4f4'];

function Demo(args: ColorInputProps) {
    const [value, setValue] = useState('#1e66f5');
    return (
        <div className="flex w-72 flex-col gap-3">
            <Field label="Brand color" helperText="Hex, rgb(), hsl() or oklch()">
                <ColorInput {...args} value={value} onValueChange={setValue} />
            </Field>
            <span className="font-mono text-xs text-muted">Value: {value}</span>
        </div>
    );
}

const meta = {
    title: 'Forms/ColorInput',
    component: ColorInput,
    args: { format: 'hex', swatches, channelInputs: true, eyeDropper: true, alpha: false, disabled: false },
    argTypes: { format: { control: 'inline-radio', options: ['hex', 'rgb', 'hsl', 'hsb', 'oklch'] } },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof ColorInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Type a color in any format (Enter takes it) or open the picker with the swatch */
export const Playground: Story = {};

/** The value in OKLCH */
export const Oklch: Story = { args: { format: 'oklch' } };
