import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Calendar, type CalendarProps } from './Calendar.js';

function Demo({ initial = ['2026-10-20', '2026-10-22'], ...args }: CalendarProps & { initial?: string[] }) {
    const [value, setValue] = useState(initial);
    return (
        <div className="flex flex-col gap-3">
            <Calendar {...args} value={value} onValueChange={setValue} />
            <span className="text-xs text-muted">Selected: {value.join(', ') || '–'}</span>
        </div>
    );
}

const meta = {
    title: 'Forms/Calendar',
    component: Calendar,
    args: { selectionMode: 'multiple', min: '2026-01-01', max: '2027-12-31' },
    argTypes: { selectionMode: { control: 'inline-radio', options: ['single', 'multiple', 'range'] } },
    render: (args) => <Demo {...(args as CalendarProps)} />,
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Range: Story = { args: { selectionMode: 'range', presets: ['last7Days', 'thisMonth'] } };

/** Calendar weeks (ISO), "Today"/"Clear" below; `allowDeselect`: the chosen day again clears it */
export const WeekNumbers: Story = {
    name: 'Week numbers',
    args: { selectionMode: 'single', showWeekNumbers: true, showButtonBar: true, allowDeselect: true },
    render: (args) => <Demo {...(args as CalendarProps)} initial={['2026-11-10']} />,
};

/** Two months side by side; the days of the neighbor months stay empty */
export const TwoMonths: Story = {
    name: 'Two months',
    args: { selectionMode: 'range', numberOfMonths: 2 },
    render: (args) => <Calendar {...args} defaultValue={['2026-11-26', '2026-12-04']} />,
};

const busy = ['2026-11-04', '2026-11-12', '2026-11-19'];

/** Own content per day: a dot below days with events (keyboard and names stay as they are) */
export const DayContent: Story = {
    name: 'Mark events',
    render: () => (
        <Calendar
            defaultValue={['2026-11-10']}
            renderDay={(date, { day }) => (
                <>
                    {day}
                    {busy.includes(date) && (
                        <span aria-hidden="true" className="absolute bottom-0.5 size-1 rounded-full bg-current" />
                    )}
                </>
            )}
        />
    ),
};
