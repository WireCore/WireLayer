import type { Meta, StoryObj } from '@storybook/react-vite';
import { Euro, Server, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../Button/Button.js';
import { Statistic } from './Statistic.js';

const meta = {
    title: 'Data/Statistic',
    component: Statistic,
    args: {
        label: 'Revenue',
        value: 48250,
        formatOptions: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
        trend: 12,
        trendLabel: 'vs. previous month',
        bordered: true,
    },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
    render: (args) => <Statistic {...args} icon={Euro} className="w-72" />,
} satisfies Meta<typeof Statistic>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Value with currency format, trend as arrow and text (the colour only adds to it) */
export const Playground: Story = {};

/** A row of key figures: unit, prefix/suffix, falling is good (error rate), no change */
export const KeyFigures: Story = {
    name: 'Key figures',
    render: () => (
        <div className="grid w-[720px] gap-4 sm:grid-cols-3">
            <Statistic
                label="Active users"
                value={1284}
                trend={4.2}
                trendLabel="since yesterday"
                icon={Users}
                bordered
            />
            <Statistic
                label="Error rate"
                value={0.8}
                unit="percent"
                trend={-12}
                invertTrend
                trendLabel="fewer errors"
                bordered
            />
            <Statistic
                label="Server"
                value={42}
                suffix="online"
                trend={0}
                trendLabel="unchanged"
                icon={Server}
                bordered
            />
        </div>
    ),
};

/** A small chart below the value (`chart`), e.g. a Sparkline */
export const WithChart: Story = {
    name: 'With chart',
    render: () => (
        <Statistic
            label="Requests per minute"
            value={312}
            trend={8}
            trendLabel="last hour"
            bordered
            className="w-72"
            chart={
                <svg viewBox="0 0 120 40" className="size-full text-primary" aria-hidden="true">
                    <polyline
                        points="0,32 20,28 40,30 60,18 80,22 100,10 120,12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                </svg>
            }
        />
    ),
};

/** While the value loads: placeholder and aria-busy */
export const Loading: Story = { name: 'Loading', args: { value: null, loading: true, trend: undefined } };

function Counting() {
    const [value, setValue] = useState(1200);
    return (
        <div className="flex flex-col items-start gap-3">
            <Statistic label="Orders today" value={value} animate live bordered className="w-72" />
            <Button variant="outline" size="sm" onClick={() => setValue(value + Math.round(Math.random() * 400))}>
                Refresh
            </Button>
        </div>
    );
}

/**
 * Counts up to the new value (only without reduced motion); screen readers get the final value at once. `live`
 * announces changes
 */
export const Animated: Story = { name: 'Animated', render: () => <Counting /> };
