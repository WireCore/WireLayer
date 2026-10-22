import type { Meta, StoryObj } from '@storybook/react-vite';
import type { PeriodRange } from '@wirecore/wirelayer-recipes';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { MonthPicker, type MonthPickerProps } from './MonthPicker.js';

function Demo(args: MonthPickerProps) {
    const [value, setValue] = useState<string | null>('2026-10');
    return (
        <div className="flex w-56 flex-col gap-3">
            <Field label="Billing month">
                <MonthPicker {...args} value={value} onValueChange={setValue} />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

const meta = {
    title: 'Forms/MonthPicker',
    component: MonthPicker,
    args: { min: '2025-01', max: '2027-12', disabled: false, invalid: false },
    render: (args) => <Demo {...(args as MonthPickerProps)} />,
} satisfies Meta<typeof MonthPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function RangeDemo() {
    const [value, setValue] = useState<PeriodRange | null>({ start: '2026-07', end: '2026-09' });
    return (
        <div className="flex w-72 flex-col gap-3">
            <Field label="Billing period">
                <MonthPicker
                    value={value}
                    onValueChange={setValue}
                    range
                    min="2025-01"
                    max="2027-12"
                    presets={['thisMonth', 'lastMonth', 'last3Months', 'thisQuarter', 'lastQuarter', 'thisYear']}
                />
            </Field>
            <span className="text-xs text-muted">
                From: {value?.start ?? '–'} · To: {value?.end ?? '–'}
            </span>
        </div>
    );
}

/** `range`: start and end in one field; presets below the grid */
export const Range: Story = { name: 'Range', render: () => <RangeDemo /> };
