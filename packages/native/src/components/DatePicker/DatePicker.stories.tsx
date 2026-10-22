import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { Text } from '../Text/Text.js';
import { TimePicker } from '../TimePicker/TimePicker.js';
import { DatePicker } from './DatePicker.js';

const weekend = (date: string) => [0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay());

function Demo() {
    const [date, setDate] = useState<string | null>('2026-10-20');
    const [time, setTime] = useState<string | null>('09:30');
    return (
        <View className="w-80 gap-4">
            <Field label="Maintenance date" helperText="Weekdays only">
                <DatePicker value={date} onValueChange={setDate} isDateUnavailable={weekend} />
            </Field>
            <Field label="Start">
                <TimePicker value={time} onValueChange={setTime} step={30} min="08:00" max="18:00" />
            </Field>
            <Text variant="muted">
                Appointment: {date ?? '–'} {time ?? ''}
            </Text>
        </View>
    );
}

const meta = {
    title: 'Forms/DatePicker',
    component: DatePicker,
    render: () => <Demo />,
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// Tomorrow at the time the story loads
const tomorrow = new Date(Date.now() + 86_400_000);

function OptionsDemo() {
    const [date, setDate] = useState<Date | null>(null);
    return (
        <View className="w-80 gap-4">
            <Field label="Delivery date" helperText="With week numbers, Today/Clear, tomorrow at the earliest">
                <DatePicker
                    value={date}
                    onValueChange={setDate}
                    valueType="date"
                    min={tomorrow}
                    showWeekNumbers
                    showButtonBar
                    clearable
                />
            </Field>
            <Text variant="muted">Date: {date ? date.toDateString() : '–'}</Text>
        </View>
    );
}

/** valueType "date", min as Date, calendar weeks, button bar and a clear button */
export const Options: Story = {
    render: () => <OptionsDemo />,
};
