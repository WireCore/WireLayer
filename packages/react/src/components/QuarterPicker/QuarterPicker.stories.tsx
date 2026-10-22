import type { PeriodRange } from '@wirecore/wirelayer-recipes';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { QuarterPicker, type QuarterPickerProps } from './QuarterPicker.js';

function Demo(args: QuarterPickerProps) {
    const [value, setValue] = useState<string | null>('2026-Q4');
    return (
        <div className="flex w-56 flex-col gap-3">
            <Field label="Reporting quarter" helperText="For example Q4 2026 or 4/2026">
                <QuarterPicker {...args} value={value} onValueChange={setValue} />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

const meta = {
    title: 'Forms/QuarterPicker',
    component: QuarterPicker,
    args: { min: '2024-Q1', max: '2028-Q4', disabled: false, invalid: false },
    render: (args) => <Demo {...(args as QuarterPickerProps)} />,
} satisfies Meta<typeof QuarterPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function RangeDemo() {
    const [value, setValue] = useState<PeriodRange | null>({ start: '2026-Q1', end: '2026-Q3' });
    return (
        <div className="flex w-72 flex-col gap-3">
            <Field label="Comparison period">
                <QuarterPicker
                    value={value}
                    onValueChange={setValue}
                    range
                    presets={['thisQuarter', 'lastQuarter', 'last4Quarters', 'thisYear', 'lastYear']}
                />
            </Field>
            <span className="text-xs text-muted">
                From: {value?.start ?? '–'} · To: {value?.end ?? '–'}
            </span>
        </div>
    );
}

/** `range`: start, then end quarter; presets like "Last quarter" or "This year" */
export const Range: Story = { name: 'Range', render: () => <RangeDemo /> };
