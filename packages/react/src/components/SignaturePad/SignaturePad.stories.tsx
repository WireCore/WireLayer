import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { SignaturePad, type SignaturePadProps } from './SignaturePad.js';

function Demo(args: SignaturePadProps) {
    const [value, setValue] = useState('');
    return (
        <div className="flex w-96 flex-col gap-3">
            <Field label="Client signature" helperText="With mouse, pen or finger – or type the name">
                <SignaturePad {...args} value={value} onValueChange={setValue} />
            </Field>
            {value && (
                <img
                    src={value}
                    alt="Signature preview"
                    className="h-16 self-start rounded border border-line bg-white"
                />
            )}
        </div>
    );
}

const meta = {
    title: 'Forms/SignaturePad',
    component: SignaturePad,
    args: { typedAlternative: true, format: 'png', disabled: false },
    argTypes: { format: { control: 'inline-radio', options: ['png', 'svg'] } },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof SignaturePad>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Draw, undo the last stroke, clear – or type the name instead (accessible alternative) */
export const Playground: Story = {};

function SvgDemo() {
    const [value, setValue] = useState('');
    return (
        <div className="flex w-96 flex-col gap-3">
            <SignaturePad
                value={value}
                onValueChange={setValue}
                label="Signature"
                format="svg"
                color="#1e3a8a"
                strokeWidth={3}
            />
            <span className="truncate font-mono text-xs text-muted">{value ? `${value.slice(0, 60)}…` : 'empty'}</span>
        </div>
    );
}

/** As SVG, with its own label and a thicker blue pen */
export const AsSvg: Story = { name: 'As SVG', render: () => <SvgDemo /> };
