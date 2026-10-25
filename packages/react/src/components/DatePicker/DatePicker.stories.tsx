import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { DateRangePicker } from '../DateRangePicker/DateRangePicker.js';
import { Field } from '../Field/Field.js';
import { MonthPicker } from '../MonthPicker/MonthPicker.js';
import { DatePicker, type DatePickerProps } from './DatePicker.js';

const weekend = (date: string) => [0, 6].includes(new Date(date).getDay());

function Demo(args: DatePickerProps) {
    const [value, setValue] = useState<string | null>('2026-10-20');
    return (
        <div className="flex w-64 flex-col gap-3">
            <Field label="Maintenance date" helperText="Weekdays only">
                <DatePicker {...args} value={value} onValueChange={setValue} isDateUnavailable={weekend} />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

const meta = {
    title: 'Forms/DatePicker',
    component: DatePicker,
    args: { disabled: false, invalid: false, min: '2026-01-01', max: '2027-12-31' },
    render: (args) => <Demo {...(args as DatePickerProps)} />,
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function WithTimeDemo() {
    const [value, setValue] = useState<string | null>('2026-10-20T14:30');
    return (
        <div className="flex w-72 flex-col gap-3">
            <Field label="Appointment">
                <DatePicker value={value} onValueChange={setValue} withTime />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

export const WithTime: Story = { render: () => <WithTimeDemo /> };

/** `size` sm, md and lg; `clearable: false` leaves out the clear button */
export const Sizes: Story = {
    name: 'Sizes',
    render: () => (
        <div className="flex w-64 flex-col gap-3">
            <Field label="Small">
                <DatePicker size="sm" defaultValue="2026-11-10" />
            </Field>
            <Field label="Medium">
                <DatePicker defaultValue="2026-11-10" />
            </Field>
            <Field label="Large, not clearable">
                <DatePicker size="lg" defaultValue="2026-11-10" clearable={false} />
            </Field>
        </div>
    ),
};

function DateObjectsDemo() {
    const [value, setValue] = useState<Date | null>(new Date(2026, 10, 10));
    return (
        <div className="flex w-64 flex-col gap-3">
            <Field label="Delivery date" helperText="Paste also works: 11/12/2026 or 2026-11-12">
                <DatePicker value={value} onValueChange={setValue} valueType="date" min={new Date(2026, 10, 2)} />
            </Field>
            <span className="text-xs text-muted">Value: {value ? value.toDateString() : '–'}</span>
        </div>
    );
}

/** `valueType: 'date'`: Date objects in and out (also for min/max) – for forms that work with Date */
export const DateObjects: Story = { name: 'Values as Date', render: () => <DateObjectsDemo /> };

const busy = ['2026-11-04', '2026-11-12', '2026-11-19', '2026-12-03'];

function CalendarOptionsDemo() {
    const [value, setValue] = useState<string | null>('2026-11-10');
    return (
        <div className="flex w-64 flex-col gap-3">
            <Field label="Meeting">
                <DatePicker
                    value={value}
                    onValueChange={setValue}
                    showWeekNumbers
                    showButtonBar
                    numberOfMonths={2}
                    allowDeselect
                    renderDay={(date, { day }) => (
                        <>
                            {day}
                            {busy.includes(date) && (
                                <span
                                    aria-hidden="true"
                                    className="absolute bottom-0.5 size-1 rounded-full bg-current"
                                />
                            )}
                        </>
                    )}
                />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

/** Calendar weeks, "Today"/"Clear" below, two months side by side and a dot below days with events */
export const CalendarOptions: Story = {
    name: 'Week numbers, two months, events',
    render: () => <CalendarOptionsDemo />,
};

function MultipleDemo() {
    const [value, setValue] = useState<string[]>(['2026-11-10', '2026-11-12']);
    return (
        <div className="flex w-72 flex-col gap-3">
            <Field label="Training days">
                <DatePicker value={value} onValueChange={setValue} selectionMode="multiple" />
            </Field>
            <span className="text-xs text-muted">Value: {value.join(', ') || '–'}</span>
        </div>
    );
}

/** `selectionMode: 'multiple'`: several days – the field lists them, the calendar toggles days */
export const Multiple: Story = { name: 'Multiple days', render: () => <MultipleDemo /> };

function TimeZoneDemo() {
    const [value, setValue] = useState<string | null>('2026-11-10T14:30Z');
    return (
        <div className="flex w-80 flex-col gap-3">
            <Field label="Departure (New York)">
                <DatePicker value={value} onValueChange={setValue} withTime timeZone="America/New_York" showTimeZone />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

/** `timeZone`: typed in the zone, the value carries its offset; `showTimeZone` names the zone */
export const TimeZone: Story = { name: 'Time zone', render: () => <TimeZoneDemo /> };

/** `responsive`: on narrow screens the calendar opens as a sheet at the bottom */
export const Responsive: Story = {
    name: 'Mobile as sheet',
    render: () => (
        <div className="flex w-64 flex-col gap-3">
            <Field label="Arrival">
                <DatePicker defaultValue="2026-11-10" responsive />
            </Field>
        </div>
    ),
};

/**
 * `placeholder`: a short text in the empty field until it gets the focus – then the date parts show. It describes
 * the field (aria-describedby) but does not replace its label. DateRangePicker, MonthPicker and YearPicker the same
 */
export const Placeholder: Story = {
    name: 'Placeholder',
    render: () => (
        <div className="flex w-72 flex-col gap-3">
            <Field label="Due date">
                <DatePicker placeholder="When it has to be paid" />
            </Field>
            <Field label="Period">
                <DateRangePicker placeholder="Any period" />
            </Field>
            <Field label="Billing month">
                <MonthPicker placeholder="Choose a month" />
            </Field>
        </div>
    ),
};
