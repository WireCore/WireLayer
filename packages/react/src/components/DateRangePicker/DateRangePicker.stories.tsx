import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { DateRangePicker, type DateRange, type DateRangePickerProps } from './DateRangePicker.js';

function Demo(args: DateRangePickerProps) {
    const [value, setValue] = useState<DateRange | null>({ start: '2026-10-20', end: '2026-10-24' });
    return (
        <div className="flex w-80 flex-col gap-3">
            <Field label="Vacation">
                <DateRangePicker {...args} value={value} onValueChange={setValue} />
            </Field>
            <span className="text-xs text-muted">
                From: {value?.start ?? '–'} · To: {value?.end ?? '–'}
            </span>
        </div>
    );
}

function WithTimeDemo() {
    const [value, setValue] = useState<DateRange | null>({ start: '2026-10-20T09:00', end: '2026-10-20T17:30' });
    return (
        <div className="flex w-[26rem] flex-col gap-3">
            <Field label="Maintenance window">
                <DateRangePicker value={value} onValueChange={setValue} withTime />
            </Field>
            <span className="text-xs text-muted">
                From: {value?.start ?? '–'} · To: {value?.end ?? '–'}
            </span>
        </div>
    );
}

const meta = {
    title: 'Forms/DateRangePicker',
    component: DateRangePicker,
    args: { disabled: false, invalid: false, withTime: false, min: '2026-01-01', max: '2027-12-31' },
    render: (args) => <Demo {...(args as DateRangePickerProps)} />,
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithTime: Story = { render: () => <WithTimeDemo /> };

/** Buttons for common ranges below the calendar */
export const Presets: Story = {
    args: { presets: ['last7Days', 'last30Days', 'thisMonth', 'lastMonth', 'thisQuarter'] },
};

/** Presets beyond days: months, quarters and years ("Last 3 months", "Last 12 months", "Last 3 years") */
export const MorePresets: Story = {
    name: 'Presets for months and years',
    args: {
        presets: ['thisMonth', 'last3Months', 'last12Months', 'thisQuarter', 'lastQuarter', 'thisYear', 'last3Years'],
    },
};

function TwoMonthsDemo() {
    const [value, setValue] = useState<DateRange | null>({ start: '2026-11-26', end: '2026-12-04' });
    return (
        <div className="flex w-80 flex-col gap-3">
            <Field label="Project phase">
                <DateRangePicker
                    value={value}
                    onValueChange={setValue}
                    numberOfMonths={2}
                    showWeekNumbers
                    showButtonBar
                />
            </Field>
            <span className="text-xs text-muted">
                From: {value?.start ?? '–'} · To: {value?.end ?? '–'}
            </span>
        </div>
    );
}

/** Two months side by side with calendar weeks – a range across the month end at a glance */
export const TwoMonths: Story = { name: 'Two months', render: () => <TwoMonthsDemo /> };
