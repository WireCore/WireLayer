import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { MiniCalendar } from '../MiniCalendar/MiniCalendar.js';
import type { TimeRange } from '../TimeRangePicker/TimeRangePicker.js';
import { TimeGrid, type TimeGridProps } from './TimeGrid.js';

function Demo(args: TimeGridProps) {
    const [value, setValue] = useState<string | null>('09:30');
    return (
        <div className="flex w-[28rem] flex-col gap-3">
            <TimeGrid {...args} value={value} onValueChange={setValue} />
            <span className="text-xs text-muted">Selected: {value ?? '–'}</span>
        </div>
    );
}

const meta = {
    title: 'Forms/TimeGrid',
    component: TimeGrid,
    args: {
        start: '09:00',
        end: '17:00',
        interval: 30,
        disabledTimes: ['10:00', '10:30', '13:00'],
        loading: false,
        disabled: false,
    },
    render: (args) => <Demo {...(args as TimeGridProps)} />,
} satisfies Meta<typeof TimeGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function RangeDemo() {
    const [value, setValue] = useState<TimeRange | null>({ start: '14:00', end: '15:30' });
    return (
        <div className="flex w-[28rem] flex-col gap-3">
            <TimeGrid
                value={value}
                onValueChange={setValue}
                range
                start="13:00"
                end="18:00"
                label="Room Elbe"
                disabledTimes={['16:00']}
            />
            <span className="text-xs text-muted">
                From: {value?.start ?? '–'} · To: {value?.end ?? '–'}
            </span>
        </div>
    );
}

/** `range`: start slot, then end slot – the slots between are marked */
export const Range: Story = { name: 'Range', render: () => <RangeDemo /> };

export const Loading: Story = { name: 'Loading', args: { loading: true } };

const weekend = (date: string) => [0, 6].includes(new Date(date).getDay());

function BookingDemo() {
    const [day, setDay] = useState<string | null>('2026-11-10');
    const [time, setTime] = useState<string | null>(null);
    return (
        <div className="flex w-[28rem] flex-col gap-4">
            <MiniCalendar
                value={day}
                onValueChange={setDay}
                startDate="2026-11-09"
                label="Day"
                isDateUnavailable={weekend}
            />
            <TimeGrid
                value={time}
                onValueChange={setTime}
                start="09:00"
                end="12:00"
                disabledTimes={day === '2026-11-10' ? ['09:30'] : []}
            />
            <span className="text-xs text-muted">
                Appointment: {day ?? '–'} {time ?? ''}
            </span>
        </div>
    );
}

/** Booking: a day from the strip, then a free time */
export const Booking: Story = { name: 'Appointment booking', render: () => <BookingDemo /> };
