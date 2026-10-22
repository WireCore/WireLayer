import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import {
    applyEventChange,
    type DataSource as EventSource,
    type SchedulerEvent,
    type SchedulerResource,
} from '@wirecore/wirelayer-recipes/native';
import { useState } from 'react';
import { View } from 'react-native';
import { Scheduler } from './Scheduler.js';

const events: SchedulerEvent[] = [
    {
        id: 'release',
        title: 'Release 2.4',
        start: '2026-10-20T16:00',
        end: '2026-10-20T17:00',
        resourceId: 'ben',
        tone: 'danger',
    },
    { id: 'team', title: 'Team meeting', start: '2026-10-21T09:00', end: '2026-10-21T10:00', resourceId: 'anna' },
    {
        id: 'customer',
        title: 'Customer meeting Miller & Co.',
        start: '2026-10-21T11:00',
        end: '2026-10-21T12:30',
        resourceId: 'ben',
        tone: 'info',
    },
    {
        id: 'lunch',
        title: 'Lunch break',
        start: '2026-10-21T12:00',
        end: '2026-10-21T13:00',
        resourceId: 'anna',
        tone: 'success',
    },
    {
        id: 'review',
        title: 'Sprint review',
        start: '2026-10-22T14:00',
        end: '2026-10-22T15:30',
        resourceId: 'elbe',
        tone: 'warn',
    },
    { id: 'trip', title: 'Company outing', start: '2026-10-23', end: '2026-10-23', allDay: true, tone: 'success' },
    {
        id: 'training',
        title: 'Accessibility training',
        start: '2026-10-26',
        end: '2026-10-27',
        allDay: true,
        resourceId: 'elbe',
    },
    { id: 'dentist', title: 'Dentist', start: '2026-10-28T08:00', end: '2026-10-28T09:00', resourceId: 'anna' },
    { id: 'holiday', title: 'Reformation Day', start: '2026-10-31', end: '2026-10-31', allDay: true, background: true },
    {
        id: 'planning',
        title: 'Quarterly planning',
        start: '2026-11-03T10:00',
        end: '2026-11-03T12:00',
        resourceId: 'ben',
    },
];

const series: SchedulerEvent[] = [
    {
        id: 'standup',
        title: 'Daily standup',
        start: '2026-10-19T09:30',
        end: '2026-10-19T09:45',
        rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
        resourceId: 'anna',
    },
    {
        id: 'jourfixe',
        title: 'Weekly sync',
        start: '2026-10-07T15:00',
        end: '2026-10-07T16:00',
        rrule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=WE',
        tone: 'info',
    },
];

const resources: SchedulerResource[] = [
    { id: 'anna', label: 'Anna Schmidt', tone: 'primary' },
    { id: 'ben', label: 'Ben Weber', tone: 'info' },
    { id: 'elbe', label: 'Elbe room', tone: 'warn' },
];

const meta = {
    title: 'Data/Scheduler',
    component: Scheduler,
    args: { events, defaultDate: '2026-10-21' },
    argTypes: {
        defaultView: { control: 'inline-radio', options: ['agenda', 'day', 'week', 'month'] },
        hideWeekends: { control: 'boolean' },
        editable: { control: 'boolean' },
    },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof Scheduler>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The next 30 days as a list: a heading per day, days without events are left out */
export const Agenda: Story = { name: 'Agenda', args: { defaultView: 'agenda', resources } };

/** Three days in view, the rest of the week scrolls sideways; all-day events on top, hours scroll */
export const Week: Story = {
    name: 'Week',
    args: {
        defaultView: 'week',
        startScrollTime: '08:00',
        businessHours: [{ days: [1, 2, 3, 4, 5], start: '08:00', end: '17:00' }],
    },
};

/** One day as a time grid */
export const Day: Story = { name: 'Day', args: { defaultView: 'day', startScrollTime: '08:00' } };

/** Compact month: days with dots, the events of the chosen day below */
export const Month: Story = { name: 'Month', args: { defaultView: 'month', events: [...events, ...series] } };

/** Filter by person or room; events show their resource and its colour */
export const Resources: Story = {
    name: 'Resources',
    args: { resources, defaultView: 'agenda', defaultResourceFilter: 'anna' },
};

/** Recurring events, expanded for the shown range; the detail sheet describes the rule */
export const Series: Story = {
    name: 'Series',
    args: { events: series, defaultView: 'week', startScrollTime: '09:00' },
};

function EditableDemo() {
    const [items, setItems] = useState([...events, ...series]);
    return (
        <Scheduler
            events={items}
            resources={resources}
            defaultDate="2026-10-21"
            defaultView="week"
            startScrollTime="08:00"
            slotMinutes={30}
            dragSnapMinutes={15}
            editable
            onEventChange={(change) => setItems((current) => applyEventChange(current, change))}
            onSlotSelect={(slot) =>
                setItems((current) => [
                    ...current,
                    {
                        id: `new-${current.length}`,
                        title: 'New event',
                        start: slot.start,
                        end: slot.end,
                        allDay: slot.allDay,
                    },
                ])
            }
        />
    );
}

/**
 * Moving events: long press and drag in the week, the accessibility actions of each event (VoiceOver/TalkBack) or the
 * buttons in the detail sheet; a series asks whether only this event or all change. Tapping an empty time adds one.
 */
export const Editable: Story = { name: 'Editing', render: () => <EditableDemo /> };

const range = (event: SchedulerEvent, start: string, end: string) =>
    !!event.rrule || (event.start.slice(0, 10) < end && event.end.slice(0, 10) >= start);
/** Answers after 600 ms with the events of the asked range */
const server: EventSource<SchedulerEvent> = {
    getItems: ({ range: asked, signal }) =>
        new Promise((resolve, reject) => {
            const timer = setTimeout(
                () =>
                    resolve({
                        items: [...events, ...series].filter((event) => !asked || range(event, asked.start, asked.end)),
                    }),
                600
            );
            signal.addEventListener('abort', () => {
                clearTimeout(timer);
                reject(Object.assign(new Error('Canceled'), { name: 'AbortError' }));
            });
        }),
};
/** Fails after 600 ms – "Try again" asks again */
const failing: EventSource<SchedulerEvent> = {
    getItems: () => new Promise((_, reject) => setTimeout(() => reject(new Error('Server unreachable')), 600)),
};

/** Events loaded per shown range (dataSource): a bar while loading, the number of loaded events is announced */
export const DataSource: Story = {
    name: 'Data source',
    args: { events: [], dataSource: server, defaultView: 'agenda' },
};

/** Loading failed: a message with "Try again" */
export const LoadError: Story = { name: 'Load error', args: { events: [], dataSource: failing } };

/** Loading state set from outside (e.g. while you load on onRangeChange yourself) */
export const Loading: Story = { name: 'Loading', args: { events: [], loading: true } };

/** No events in the shown range */
export const Empty: Story = { name: 'Empty', args: { events: [] } };
