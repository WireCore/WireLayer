import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { Text } from '../Text/Text.js';
import { TimePicker } from './TimePicker.js';

function Demo() {
    const [time, setTime] = useState<string | null>('12:00');
    const [zoned, setZoned] = useState<string | null>(null);
    return (
        <View className="w-80 gap-4">
            <Field label="Lunch break">
                <TimePicker
                    value={time}
                    onValueChange={setTime}
                    clearable
                    options={[
                        { value: '11:30' },
                        { value: '12:00', label: 'Noon' },
                        { value: '12:30' },
                        { value: '13:00', disabled: true },
                    ]}
                />
            </Field>
            <Field label="Call (Berlin)" helperText="The value carries the time zone offset">
                <TimePicker
                    value={zoned}
                    onValueChange={setZoned}
                    timeZone="Europe/Berlin"
                    referenceDate="2026-10-20"
                    showTimeZone
                    step={60}
                    min="08:00"
                    max="18:00"
                />
            </Field>
            <Text variant="muted">
                Values: {time ?? '–'} · {zoned ?? '–'}
            </Text>
        </View>
    );
}

const meta = {
    title: 'Forms/TimePicker',
    component: TimePicker,
    render: () => <Demo />,
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
