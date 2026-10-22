import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { TimePicker, type TimeOption, type TimePickerProps } from './TimePicker.js';

function Demo(args: TimePickerProps) {
    const [value, setValue] = useState<string | null>('09:30');
    return (
        <div className="flex w-48 flex-col gap-3">
            <Field label="Start" helperText="Between 7 AM and 7 PM">
                <TimePicker {...args} value={value} onValueChange={setValue} />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

const meta = {
    title: 'Forms/TimePicker',
    component: TimePicker,
    args: { step: 30, min: '07:00', max: '19:00', disabled: false, invalid: false },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const QuarterHours: Story = { args: { step: 15, min: undefined, max: undefined } };

function ValueDemo({ label, initial, ...props }: TimePickerProps & { label: string; initial: string | null }) {
    const [value, setValue] = useState<string | null>(initial);
    return (
        <div className="flex w-56 flex-col gap-3">
            <Field label={label}>
                <TimePicker {...props} value={value} onValueChange={setValue} />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

/** `withSeconds`: hour, minute and second ("HH:mm:ss") */
export const WithSeconds: Story = {
    name: 'With seconds',
    render: () => <ValueDemo label="Start time" initial="09:30:15" withSeconds step={15} />,
};

/** `hourCycle: 'h12'`: 12 hours with AM/PM in field and list – the value stays "HH:mm" */
export const TwelveHours: Story = {
    name: '12 hours',
    render: () => <ValueDemo label="Start" initial="14:30" hourCycle="h12" />,
};

const shifts: TimeOption[] = [
    { value: '08:00', label: '08:00 – Early shift' },
    { value: '14:00', label: '14:00 – Late shift' },
    { value: '22:00', label: '22:00 – Night shift' },
];

/** `options`: own times for the list, optionally named */
export const Options: Story = {
    name: 'Custom times',
    render: () => <ValueDemo label="Shift start" initial={null} options={shifts} />,
};

/** `timeZone`: the time is typed in the zone, the value carries its offset ("14:30-05:00") */
export const TimeZone: Story = {
    name: 'Time zone',
    render: () => (
        <ValueDemo
            label="Call (New York)"
            initial="15:00Z"
            timeZone="America/New_York"
            referenceDate="2026-11-10"
            showTimeZone
        />
    ),
};
