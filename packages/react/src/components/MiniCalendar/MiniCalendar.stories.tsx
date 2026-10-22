import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { MiniCalendar, type MiniCalendarProps } from './MiniCalendar.js';

function Demo(args: MiniCalendarProps) {
    const [value, setValue] = useState<string | null>('2026-11-10');
    return (
        <div className="flex w-[28rem] flex-col gap-3">
            <MiniCalendar {...args} value={value} onValueChange={setValue} label="Delivery day" />
            <span className="text-xs text-muted">Selected: {value ?? '–'}</span>
        </div>
    );
}

const meta = {
    title: 'Forms/MiniCalendar',
    component: MiniCalendar,
    args: { startDate: '2026-11-09', days: 7, min: '2026-11-05', disabled: false },
    render: (args) => <Demo {...(args as MiniCalendarProps)} />,
} satisfies Meta<typeof MiniCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Five working days per page */
export const WorkingDays: Story = { name: 'Five days', args: { days: 5 } };
