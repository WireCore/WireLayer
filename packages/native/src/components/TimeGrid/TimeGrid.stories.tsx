import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { MiniCalendar } from '../MiniCalendar/MiniCalendar.js';
import { Text } from '../Text/Text.js';
import { TimeGrid, type TimeGridRange } from './TimeGrid.js';

function Demo() {
    const [day, setDay] = useState<string | null>('2026-10-21');
    const [time, setTime] = useState<string | null>(null);
    const [range, setRange] = useState<TimeGridRange>({ start: null, end: null });
    return (
        <View className="w-[360px] gap-4">
            <MiniCalendar value={day} onValueChange={setDay} startDate="2026-10-19" label="Appointment day" />
            <TimeGrid
                value={time}
                onValueChange={setTime}
                start="09:00"
                end="12:00"
                disabledTimes={['10:00', '10:30']}
            />
            <TimeGrid
                label="Book a room (from – to)"
                range
                value={range}
                onValueChange={setRange}
                start="13:00"
                end="16:00"
                interval={60}
                columns={3}
            />
            <Text variant="muted">
                {day ?? '–'} · {time ?? '–'} · {range.start ?? '–'}–{range.end ?? '–'}
            </Text>
        </View>
    );
}

const meta = {
    title: 'Forms/TimeGrid',
    component: TimeGrid,
    render: () => <Demo />,
} satisfies Meta<typeof TimeGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** MiniCalendar and TimeGrid for a booking */
export const Playground: Story = {};
