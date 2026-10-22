import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { MaskInput, type MaskInputProps } from './MaskInput.js';

function Demo(args: MaskInputProps) {
    const [value, setValue] = useState('');
    const [raw, setRaw] = useState('');
    return (
        <div className="flex w-80 flex-col gap-3">
            <Field label="IBAN" helperText="Type digits only – spaces are added automatically">
                <MaskInput
                    {...args}
                    value={value}
                    onValueChange={(masked, digits) => {
                        setValue(masked);
                        setRaw(digits);
                    }}
                />
            </Field>
            <span className="text-xs text-muted">
                Value: {value || '–'} · Digits: {raw || '–'}
            </span>
        </div>
    );
}

const meta = {
    title: 'Forms/MaskInput',
    component: MaskInput,
    args: { mask: 'DE99 9999 9999 9999 9999 99' },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof MaskInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Formats: Story = {
    render: () => (
        <div className="flex w-64 flex-col gap-4">
            <Field label="Phone">
                <MaskInput mask={'+4\\9 999 99999999'} />
            </Field>
            <Field label="ZIP code">
                <MaskInput mask="99999" />
            </Field>
            <Field label="License plate">
                <MaskInput mask="aa-aa 9999" />
            </Field>
        </div>
    ),
};

const hex = { h: /[0-9a-f]/i };

function OptionsDemo() {
    const [zip, setZip] = useState('');
    const [done, setDone] = useState('');
    return (
        <div className="flex w-72 flex-col gap-4">
            <Field label="ZIP code (with optional extension)" helperText="value without separators">
                <MaskInput value={zip} onValueChange={setZip} mask="99999?-9999" slotChar="#" unmask />
            </Field>
            <Field label="Color" helperText="Hex digits; cleared on leave if incomplete">
                <MaskInput mask="#hhhhhh" tokens={hex} autoClear onComplete={setDone} />
            </Field>
            <span className="text-xs text-muted" aria-live="polite">
                ZIP: {zip || '–'} · Color done: {done || '–'}
            </span>
        </div>
    );
}

/**
 * Optional rest after "?", own slot character and tokens, `unmask` (value without separators), `autoClear` (an
 * incomplete value is emptied on leaving) and `onComplete`
 */
export const Options: Story = { name: 'Options', render: () => <OptionsDemo /> };
