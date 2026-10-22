import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { DurationInput } from '../DurationInput/DurationInput.js';
import { Field } from '../Field/Field.js';
import { Text } from '../Text/Text.js';
import { TimeRangePicker, type TimeRange } from './TimeRangePicker.js';

function Demo() {
    const [hours, setHours] = useState<TimeRange | null>({ start: '09:00', end: '17:30' });
    const [duration, setDuration] = useState<number | string | null>(150);
    return (
        <View className="w-80 gap-4">
            <Field label="Working hours">
                <TimeRangePicker value={hours} onValueChange={setHours} min="06:00" max="22:00" clearable />
            </Field>
            <Field label="Duration" helperText="Hours and minutes">
                <DurationInput value={duration} onValueChange={setDuration} clearable />
            </Field>
            <Field label="Runtime with days">
                <DurationInput defaultValue="P1DT2H" valueType="iso" withDays />
            </Field>
            <Text variant="muted">
                {hours ? `${hours.start} – ${hours.end}` : '–'} · {duration ?? '–'} minutes
            </Text>
        </View>
    );
}

const meta = {
    title: 'Forms/TimeRangePicker',
    component: TimeRangePicker,
    render: () => <Demo />,
} satisfies Meta<typeof TimeRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** TimeRangePicker and DurationInput */
export const Playground: Story = {};
