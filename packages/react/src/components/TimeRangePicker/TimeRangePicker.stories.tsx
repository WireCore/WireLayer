import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { TimeRangePicker, type TimeRange, type TimeRangePickerProps } from './TimeRangePicker.js';

function Demo(args: TimeRangePickerProps) {
    const [value, setValue] = useState<TimeRange | null>({ start: '09:00', end: '17:30' });
    return (
        <div className="flex w-64 flex-col gap-3">
            <Field label="Working hours" helperText="Paste also works: 08:00 – 16:00">
                <TimeRangePicker {...args} value={value} onValueChange={setValue} />
            </Field>
            <span className="text-xs text-muted">
                From: {value?.start ?? '–'} · To: {value?.end ?? '–'}
            </span>
        </div>
    );
}

const meta = {
    title: 'Forms/TimeRangePicker',
    component: TimeRangePicker,
    args: { min: '06:00', max: '22:00', disabled: false, invalid: false },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof TimeRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** 12 hours with AM/PM */
export const TwelveHours: Story = { name: '12 hours', args: { hourCycle: 'h12' } };
