import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { PinInput, type PinInputProps } from './PinInput.js';

function Demo(args: PinInputProps) {
    const [code, setCode] = useState('');
    const [done, setDone] = useState('');
    return (
        <div className="flex flex-col gap-3">
            <Field label="Verification code" helperText="We sent you a 6-digit code by SMS">
                <PinInput {...args} value={code} onValueChange={setCode} onValueComplete={setDone} />
            </Field>
            <span className="text-xs text-muted">{done ? `Complete: ${done}` : `Input: ${code || '–'}`}</span>
        </div>
    );
}

const meta = {
    title: 'Forms/PinInput',
    component: PinInput,
    args: { length: 6, type: 'numeric', mask: false, invalid: false, disabled: false },
    argTypes: { type: { control: 'inline-radio', options: ['numeric', 'alphanumeric', 'alphabetic'] } },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof PinInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
