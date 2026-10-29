import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { NativeSelect, type NativeSelectProps } from './NativeSelect.js';

const items = [
    { value: 'fra', label: 'Frankfurt' },
    { value: 'nue', label: 'Nuremberg' },
    { value: 'vie', label: 'Vienna', disabled: true },
];

function Demo(args: NativeSelectProps) {
    const [value, setValue] = useState('nue');
    return (
        <div className="flex w-64 flex-col gap-3">
            <Field label="Location">
                <NativeSelect {...args} value={value} onValueChange={setValue} />
            </Field>
            <span className="text-xs text-muted">Value: {value || '–'}</span>
        </div>
    );
}

const meta = {
    title: 'Forms/NativeSelect',
    component: NativeSelect,
    args: { items, placeholder: 'Select', size: 'md', disabled: false, invalid: false },
    argTypes: { items: { control: false }, size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof NativeSelect<string>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const ports = [
    { value: 22, label: '22 (SSH)' },
    { value: 2222, label: '2222' },
    { value: 443, label: '443 (HTTPS)' },
];

function NumberValuesDemo() {
    const [port, setPort] = useState<number | ''>(22);
    return (
        <div className="flex w-64 flex-col gap-3">
            <Field label="Port">
                <NativeSelect items={ports} value={port} onValueChange={setPort} />
            </Field>
            <span className="text-xs text-muted">
                Value: {port} ({typeof port})
            </span>
        </div>
    );
}

/** Number values: onValueChange gets numbers back; the placeholder option gives an empty string */
export const NumberValues: Story = { name: 'Number values', render: () => <NumberValuesDemo /> };
