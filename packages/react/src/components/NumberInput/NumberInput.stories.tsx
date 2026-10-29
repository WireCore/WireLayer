import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { NumberInput, type NumberInputEmptyFallback, type NumberInputProps } from './NumberInput.js';

function Demo(args: NumberInputProps<NumberInputEmptyFallback | undefined>) {
    const [value, setValue] = useState<number | null>(8);
    return (
        <Field label="Number of servers" helperText="Between 0 and 100" className="w-60">
            <NumberInput {...args} value={value} onValueChange={setValue} />
        </Field>
    );
}

const meta = {
    title: 'Forms/NumberInput',
    component: NumberInput,
    args: { size: 'md', min: 0, max: 100, step: 1, disabled: false, invalid: false },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Formats: Story = {
    render: () => (
        <div className="flex w-60 flex-col gap-4">
            <Field label="Budget">
                <NumberInput defaultValue={12500} step={100} formatOptions={{ style: 'currency', currency: 'EUR' }} />
            </Field>
            <Field label="Discount">
                <NumberInput defaultValue={0.15} step={0.05} min={0} max={1} formatOptions={{ style: 'percent' }} />
            </Field>
            <Field label="Weight (kg)">
                <NumberInput defaultValue={2.5} step={0.1} size="sm" />
            </Field>
        </div>
    ),
};

function OptionsDemo() {
    const [price, setPrice] = useState<number | null>(12.5);
    return (
        <div className="flex w-60 flex-col gap-4">
            <Field label="Quantity (no buttons)">
                <NumberInput defaultValue={3} stepper={false} selectOnFocus />
            </Field>
            <Field label="Font size">
                <NumberInput defaultValue={12} stepperLayout="stacked" suffix="pt" />
            </Field>
            <Field label="Price" helperText="Two decimals, not negative">
                <NumberInput
                    value={price}
                    onValueChange={setPrice}
                    decimals={2}
                    allowNegative={false}
                    prefix="≈"
                    suffix="€"
                    clearable
                />
            </Field>
            <Field label="Pieces" helperText="Whole numbers only, at most 10">
                <NumberInput defaultValue={4} allowDecimal={false} max={10} clampBehavior="strict" />
            </Field>
        </div>
    );
}

/**
 * Without buttons, stacked buttons, free prefix/suffix, fixed decimals, no negatives and selecting on focus. "." and
 * "," both type the decimal separator; pasted numbers are read in either notation
 */
export const Options: Story = { name: 'Options', render: () => <OptionsDemo /> };

function EmptyFallbackDemo() {
    const [port, setPort] = useState(22);
    const [retries, setRetries] = useState(3);
    return (
        <div className="flex w-60 flex-col gap-4">
            <Field label="Port" helperText="Empty: back to the last port">
                <NumberInput
                    value={port}
                    onValueChange={setPort}
                    min={1}
                    max={65535}
                    stepper={false}
                    emptyFallback="previous"
                />
            </Field>
            <Field label="Retries" helperText="Empty: the minimum">
                <NumberInput value={retries} onValueChange={setRetries} min={1} max={10} emptyFallback="min" />
            </Field>
            <span className="text-xs text-muted">
                Port {port} · retries {retries}
            </span>
        </div>
    );
}

/**
 * A field that is never empty: `emptyFallback="previous"` puts the last valid number back when an emptied field is
 * left (or Enter is pressed), `"min"` the minimum – onValueChange is then typed `number`
 */
export const EmptyFallback: Story = { name: 'Empty fallback', render: () => <EmptyFallbackDemo /> };
