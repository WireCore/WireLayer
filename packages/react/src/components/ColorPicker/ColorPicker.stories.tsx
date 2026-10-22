import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { ColorPicker, type ColorPickerProps } from './ColorPicker.js';

const swatches = ['#0a0a0a', '#1e66f5', '#7c3aed', '#0d9488', '#16a34a', '#d97706', '#dc2626', '#f4f4f4'];

function Demo(args: ColorPickerProps) {
    const [value, setValue] = useState('#1e66f5');
    return (
        <div className="flex w-64 flex-col gap-3">
            <Field label="Accent color">
                <ColorPicker {...args} value={value} onValueChange={setValue} />
            </Field>
            <span className="text-xs text-muted">Value: {value}</span>
        </div>
    );
}

const meta = {
    title: 'Forms/ColorPicker',
    component: ColorPicker,
    args: { alpha: false, swatches, disabled: false },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithAlpha: Story = { args: { alpha: true } };

function OklchDemo() {
    const [value, setValue] = useState('oklch(55.4% 0.218 262.9)');
    return (
        <div className="flex w-64 flex-col gap-3">
            <Field label="Accent color">
                <ColorPicker value={value} onValueChange={setValue} format="oklch" channelInputs eyeDropper />
            </Field>
            <span className="text-xs text-muted">Value: {value}</span>
        </div>
    );
}

/** Value in OKLCH; number fields for RGB, HSL, HSB or OKLCH and the eye dropper (where the browser has one) */
export const Oklch: Story = { render: () => <OklchDemo /> };

/** Only a palette: the popup shows the preset colors */
export const PaletteOnly: Story = { name: 'Palette only', args: { withPicker: false } };
