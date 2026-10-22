import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { DurationInput, type DurationInputProps } from './DurationInput.js';

function Demo(args: DurationInputProps) {
    const [value, setValue] = useState<number | string | null>(150);
    return (
        <div className="flex w-64 flex-col gap-3">
            <Field label="Effort" helperText="Hours and minutes, also over 24 hours">
                <DurationInput {...args} value={value} onValueChange={setValue} />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

const meta = {
    title: 'Forms/DurationInput',
    component: DurationInput,
    args: { valueType: 'minutes', withDays: false, withSeconds: false, disabled: false, invalid: false },
    argTypes: { valueType: { control: 'inline-radio', options: ['minutes', 'seconds', 'iso'] } },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof DurationInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function DaysAndSecondsDemo() {
    const [value, setValue] = useState<number | string | null>('P1DT2H30M');
    return (
        <div className="flex w-80 flex-col gap-3">
            <Field label="Runtime">
                <DurationInput value={value} onValueChange={setValue} valueType="iso" withDays withSeconds />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

/** Days, hours, minutes and seconds; the value as ISO 8601 duration ("P1DT2H30M") */
export const DaysAndSeconds: Story = { name: 'With days and seconds (ISO)', render: () => <DaysAndSecondsDemo /> };
