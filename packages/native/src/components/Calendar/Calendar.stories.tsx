import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { Calendar } from './Calendar.js';

const weekend = (date: string) => [0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay());

function Demo() {
    const [value, setValue] = useState<string | null>('2026-10-20');
    return (
        <View className="w-80 gap-3">
            <Calendar value={value} onValueChange={setValue} isDateUnavailable={weekend} />
            <Text variant="muted">Selected: {value ?? '–'}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/Calendar',
    component: Calendar,
    render: () => <Demo />,
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WeekNumbers: Story = {
    render: () => (
        <View className="w-80">
            <Calendar defaultValue="2026-10-20" showWeekNumbers showButtonBar hideOutsideDays firstDayOfWeek={1} />
        </View>
    ),
};
