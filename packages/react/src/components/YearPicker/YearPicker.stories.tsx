import type { Meta, StoryObj } from '@storybook/react-vite';
import type { PeriodRange } from '@wirecore/wirelayer-recipes';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { YearPicker, type YearPickerProps } from './YearPicker.js';

function Demo(args: YearPickerProps) {
    const [value, setValue] = useState<string | null>('2026');
    return (
        <div className="flex w-48 flex-col gap-3">
            <Field label="Fiscal year">
                <YearPicker {...args} value={value} onValueChange={setValue} />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

const meta = {
    title: 'Forms/YearPicker',
    component: YearPicker,
    args: { min: '2015', max: '2035', disabled: false, invalid: false },
    render: (args) => <Demo {...(args as YearPickerProps)} />,
} satisfies Meta<typeof YearPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function RangeDemo() {
    const [value, setValue] = useState<PeriodRange | null>({ start: '2024', end: '2026' });
    return (
        <div className="flex w-60 flex-col gap-3">
            <Field label="Fiscal years">
                <YearPicker
                    value={value}
                    onValueChange={setValue}
                    range
                    min="2015"
                    max="2035"
                    presets={['thisYear', 'lastYear', 'last3Years', 'last5Years']}
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
