import type { Meta, StoryObj } from '@storybook/vue3-vite';
import {
    applyEventChange,
    SCHEDULER_DRAG_TYPE,
    toICalendar,
    type DataRequest,
    type SchedulerEvent,
    type SchedulerResource,
} from '@wirecore/wirelayer-recipes';
import { ref } from 'vue';
import Button from '../Button/Button.vue';
import DatePicker from '../DatePicker/DatePicker.vue';
import Dialog from '../Dialog/Dialog.vue';
import DialogContent from '../Dialog/DialogContent.vue';
import Scheduler, {
    type SchedulerChange,
    type SchedulerDropOutside,
    type SchedulerDropRejection,
    type SchedulerExternalDrop,
    type SchedulerRange,
    type SchedulerSlot,
} from './Scheduler.vue';

const events: SchedulerEvent[] = [
    { id: 'standup-mo', title: 'Stand-up', start: '2026-10-19T09:00', end: '2026-10-19T09:15', tone: 'info' },
    { id: 'kickoff', title: 'Customer portal kick-off', start: '2026-10-19T10:00', end: '2026-10-19T12:00' },
    { id: 'review', title: 'Code review', start: '2026-10-20T11:00', end: '2026-10-20T12:30', tone: 'success' },
    {
        id: 'lunch',
        title: 'Lunch with Northside Utilities',
        start: '2026-10-20T12:00',
        end: '2026-10-20T13:30',
        tone: 'warn',
    },
    { id: 'deploy', title: 'Maintenance window', start: '2026-10-21T16:00', end: '2026-10-21T18:00', tone: 'danger' },
    { id: 'workshop', title: 'UX workshop', start: '2026-10-22T09:30', end: '2026-10-22T15:00' },
    { id: 'retro', title: 'Retro', start: '2026-10-23T14:00', end: '2026-10-23T15:00', tone: 'info' },
    {
        id: 'trade-fair',
        title: 'Frankfurt trade fair',
        start: '2026-10-21',
        end: '2026-10-22',
        allDay: true,
        tone: 'success',
    },
    { id: 'vacation', title: 'Julia on vacation', start: '2026-10-26', end: '2026-10-30', allDay: true, tone: 'warn' },
];

const resources: SchedulerResource[] = [
    { id: 'julia', label: 'Julia Brandt', tone: 'info', group: 'Engineering' },
    { id: 'malte', label: 'Malte Heise', group: 'Engineering' },
    { id: 'elbe', label: 'Elbe room', tone: 'success', group: 'Rooms' },
    { id: 'alster', label: 'Alster room', tone: 'warn', group: 'Rooms' },
];
const resourceEvents: SchedulerEvent[] = [
    { id: 'r1', title: 'Sprint planning', start: '2026-10-19T09:00', end: '2026-10-19T10:30', resourceId: 'julia' },
    { id: 'r2', title: 'Pairing', start: '2026-10-19T11:00', end: '2026-10-19T12:30', resourceId: 'malte' },
    { id: 'r3', title: 'Customer meeting', start: '2026-10-20T10:00', end: '2026-10-20T11:30', resourceId: 'elbe' },
    { id: 'r4', title: 'Job interview', start: '2026-10-20T14:00', end: '2026-10-20T15:00', resourceId: 'alster' },
    { id: 'r5', title: 'Code review', start: '2026-10-21T13:00', end: '2026-10-21T14:00', resourceId: 'malte' },
    { id: 'r6', title: 'Training', start: '2026-10-22', end: '2026-10-23', allDay: true, resourceId: 'elbe' },
    { id: 'r7', title: 'Support', start: '2026-10-23T08:00', end: '2026-10-23T12:00', resourceId: 'julia' },
];
const businessHours = [
    { days: [1, 2, 3, 4], start: '08:00', end: '17:00' },
    { days: [5], start: '08:00', end: '13:00' },
];

// Sixty technicians in three teams – the timeline only renders the rows in view
const technicians: SchedulerResource[] = Array.from({ length: 60 }, (_, index) => ({
    id: `t${index + 1}`,
    label: `Technician ${String(index + 1).padStart(2, '0')}`,
    group: ['Team North', 'Team Central', 'Team South'][Math.floor(index / 20)],
}));
const jobs: SchedulerEvent[] = technicians.flatMap((technician, index) => [
    {
        id: `${technician.id}-a`,
        title: `Job ${index + 1}`,
        start: `2026-10-${String(19 + (index % 5)).padStart(2, '0')}T08:00`,
        end: `2026-10-${String(19 + (index % 5)).padStart(2, '0')}T12:00`,
        resourceId: technician.id,
        tone: (['primary', 'info', 'success'] as const)[index % 3],
    },
    {
        id: `${technician.id}-b`,
        title: 'Maintenance',
        start: `2026-10-${String(20 + (index % 4)).padStart(2, '0')}T13:00`,
        end: `2026-10-${String(21 + (index % 4)).padStart(2, '0')}T10:00`,
        resourceId: technician.id,
        tone: 'warn',
    },
]);

const series: SchedulerEvent[] = [
    {
        id: 'jour-fixe',
        title: 'Weekly sync',
        start: '2026-10-05T09:30',
        end: '2026-10-05T10:00',
        rrule: 'FREQ=WEEKLY;BYDAY=MO,TH',
        exdate: ['2026-10-22T09:30'],
        tone: 'info',
    },
    {
        id: 'board',
        title: 'Monthly meeting',
        start: '2026-10-12T14:00',
        end: '2026-10-12T15:30',
        rrule: 'FREQ=MONTHLY;BYDAY=2MO',
        overrides: { '2026-11-09T14:00': { start: '2026-11-10T14:00', end: '2026-11-10T15:30' } },
    },
    {
        id: 'sport',
        title: 'Running group',
        start: '2026-10-01T18:00',
        end: '2026-10-01T19:00',
        rrule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=WE;COUNT=8',
        tone: 'success',
    },
    {
        id: 'payday',
        title: 'Payroll run',
        start: '2026-01-31',
        end: '2026-01-31',
        allDay: true,
        rrule: 'FREQ=MONTHLY;BYMONTHDAY=-1',
        tone: 'warn',
    },
];

const meta = {
    title: 'Data/Scheduler',
    component: Scheduler,
    args: { events, defaultDate: '2026-10-20', defaultView: 'week', editable: true, startHour: 8, endHour: 19 },
    argTypes: {
        defaultView: { control: 'inline-radio', options: ['day', 'week', 'month', 'agenda', 'timeline', 'year'] },
    },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { Scheduler },
        setup: () => {
            const items = ref(args.events ?? events);
            const last = ref('–');
            return {
                args,
                items,
                last,
                onChange: (change: SchedulerChange) => (items.value = applyEventChange(items.value, change)),
                onRejected: (rejection: SchedulerDropRejection) => (last.value = `Rejected: ${rejection.reason}`),
                onSlot: (slot: SchedulerSlot) =>
                    (last.value = `New: ${slot.start}${slot.resourceId ? ` (${slot.resourceId})` : ''}`),
                onClick: (event: SchedulerEvent) => (last.value = event.title),
            };
        },
        template: `
            <div class="flex max-w-5xl flex-col gap-2">
                <Scheduler v-bind="args" :events="items" @event-change="onChange" @drop-rejected="onRejected" @slot-select="onSlot" @event-click="onClick" />
                <span class="text-xs text-muted">Last: {{ last }}</span>
            </div>`,
    }),
} satisfies Meta<typeof Scheduler>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Month: Story = { args: { defaultView: 'month' } };

export const Agenda: Story = { args: { defaultView: 'agenda', defaultDate: '2026-10-19' } };

/** People and rooms as columns (per day or per resource); Alt+Shift+arrow keys move to the neighbouring resource */
export const Resources: Story = {
    name: 'Resources',
    args: {
        events: resourceEvents,
        resources,
        preventOverlap: true,
        views: ['day', 'week', 'month', 'timeline'],
    },
    argTypes: { groupBy: { control: 'inline-radio', options: ['date', 'resource'] } },
};

/** Many resources in the week: two at a time, the buttons in the toolbar page through them */
export const ResourcesPaged: Story = {
    name: 'Paged resources',
    args: { events: resourceEvents, resources, resourcesPerPage: 2, views: ['day', 'week'] },
};

/** Resources as rows, time from left to right; 60 rows – only the visible ones are rendered */
export const Timeline: Story = {
    name: 'Timeline',
    args: {
        events: jobs,
        resources: technicians,
        defaultView: 'timeline',
        views: ['week', 'timeline'],
        businessHours,
        height: '520px',
    },
};

/** Weekly, every 2nd Monday, every other week with an end, last day of the month; changed and left-out occurrences */
export const Series: Story = {
    name: 'Recurring events',
    args: { events: series, views: ['week', 'month', 'agenda'] },
    render: (args) => ({
        components: { Scheduler },
        setup: () => {
            const items = ref(series);
            return {
                args,
                items,
                ical: () => toICalendar(items.value, { name: 'Team', timeZone: 'Europe/Berlin', now: new Date(0) }),
                onChange: (change: SchedulerChange) => (items.value = applyEventChange(items.value, change)),
            };
        },
        template: `
            <div class="flex max-w-5xl flex-col gap-2">
                <Scheduler v-bind="args" :events="items" @event-change="onChange" />
                <details class="text-xs">
                    <summary class="cursor-pointer">As iCalendar</summary>
                    <pre class="mt-2 max-h-64 overflow-auto rounded-md bg-bg-2 p-2">{{ ical() }}</pre>
                </details>
            </div>`,
    }),
};

/** Opening hours (Friday until 13:00) hatched, a holiday in the background, no weekend; moving in 15-minute steps */
export const BusinessHours: Story = {
    name: 'Business hours',
    args: {
        businessHours,
        hideWeekends: true,
        startHour: 0,
        endHour: 24,
        startScrollTime: '07:30',
        height: '480px',
        dragSnapMinutes: 15,
        resizeSnapMinutes: 15,
        events: [
            ...events.filter((event) => !event.allDay),
            {
                id: 'feiertag',
                title: 'Reformation Day',
                start: '2026-10-31',
                end: '2026-10-31',
                allDay: true,
                background: true,
            },
            {
                id: 'sperre',
                title: 'Server maintenance',
                start: '2026-10-22T06:00',
                end: '2026-10-22T08:00',
                background: true,
                tone: 'danger',
            },
        ],
        defaultDate: '2026-10-28',
    },
};

/** Twelve small months; days with events are marked – a click (or Enter) opens the day */
export const Year: Story = {
    name: 'Year',
    args: { defaultView: 'year', views: ['day', 'month', 'year'], events: [...events, ...series] },
};

/** "+2 more" opens a popover with all events of the day */
export const MorePopover: Story = {
    name: 'More in popover',
    args: { defaultView: 'month', morePopover: true, monthEventLimit: 1 },
};

/** Narrow: a compact month with dots, the events of the chosen day below */
export const Compact: Story = {
    name: 'Compact month',
    args: { defaultView: 'month', compactBreakpoint: 640, views: ['month', 'agenda'] },
    render: (args) => ({
        components: { Scheduler },
        setup: () => ({ args }),
        template: '<div class="w-80"><Scheduler v-bind="args" /></div>',
    }),
};

/** Times with offset shown in New York – changes come back with that zone's offset */
export const TimeZone: Story = {
    name: 'Time zone',
    args: {
        timeZone: 'America/New_York',
        startHour: 0,
        endHour: 24,
        startScrollTime: '06:00',
        events: [
            { id: 'call', title: 'Call with Berlin', start: '2026-10-20T13:00Z', end: '2026-10-20T14:00Z' },
            { id: 'sync', title: 'Sync Tokyo', start: '2026-10-21T00:30Z', end: '2026-10-21T01:30Z', tone: 'info' },
        ],
    },
};

const delay = (ms: number, signal: AbortSignal) =>
    new Promise<void>((done, fail) => {
        const timer = setTimeout(done, ms);
        signal.addEventListener('abort', () => {
            clearTimeout(timer);
            fail(new DOMException('Canceled', 'AbortError'));
        });
    });

/** Events are loaded per shown range (cancelled when you navigate on, cached for a minute) */
export const RangeLoading: Story = {
    name: 'Loading by range',
    render: (args) => ({
        components: { Scheduler },
        setup: () => {
            const range = ref('–');
            const dataSource = {
                getItems: async ({ range: shown, signal }: DataRequest) => {
                    await delay(600, signal);
                    const first = new Date(`${shown!.start}T00:00`);
                    return {
                        items: Array.from({ length: 6 }, (_, index) => {
                            const day = new Date(first.getFullYear(), first.getMonth(), first.getDate() + index);
                            const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                            return {
                                id: `${date}-${index}`,
                                title: `Event ${index + 1}`,
                                start: `${date}T${String(9 + index).padStart(2, '0')}:00`,
                                end: `${date}T${String(10 + index).padStart(2, '0')}:00`,
                            };
                        }),
                    };
                },
            };
            return {
                args,
                dataSource,
                range,
                onRange: (shown: SchedulerRange) => (range.value = `${shown.start} to ${shown.end} (${shown.view})`),
            };
        },
        template: `
            <div class="flex max-w-5xl flex-col gap-2">
                <Scheduler v-bind="args" :events="[]" :data-source="dataSource" :cache-time="60000" @range-change="onRange" />
                <span class="text-xs text-muted">Range: {{ range }}</span>
            </div>`,
    }),
};

/**
 * Unplanned orders: drag them onto a time (or use "Schedule…" with the keyboard); dragging an event back onto the
 * list unplans it
 */
export const Unplanned: Story = {
    name: 'Schedule unplanned orders',
    render: (args) => ({
        components: { Scheduler, Button, DatePicker, Dialog, DialogContent },
        setup: () => {
            const orders = ref([
                { id: 'o1', title: 'Check heating, Kühn family', duration: 90 },
                { id: 'o2', title: 'Meter replacement Lindenstraße', duration: 60 },
                { id: 'o3', title: 'On-site quote, Jansen Bakery', duration: 120 },
            ]);
            const items = ref<SchedulerEvent[]>(events.filter((event) => !event.allDay));
            const planning = ref<(typeof orders.value)[number] | null>(null);
            const when = ref<string | null>('2026-10-21T10:00');
            const plan = (order: { id: string; title: string; duration: number }, start: string) => {
                const end = new Date(new Date(start).getTime() + order.duration * 60_000);
                const pad = (value: number) => String(value).padStart(2, '0');
                items.value = [
                    ...items.value,
                    {
                        id: order.id,
                        title: order.title,
                        start,
                        end: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`,
                        tone: 'info',
                    },
                ];
                orders.value = orders.value.filter((item) => item.id !== order.id);
            };
            return {
                args,
                orders,
                items,
                planning,
                when,
                onDragStart: (dragEvent: DragEvent, order: (typeof orders.value)[number]) => {
                    dragEvent.dataTransfer?.setData(SCHEDULER_DRAG_TYPE, JSON.stringify(order));
                    dragEvent.dataTransfer?.setData('text/plain', order.title);
                },
                onDrop: (drop: SchedulerExternalDrop) => {
                    const order = drop.data as (typeof orders.value)[number] | null;
                    if (order && !drop.allDay) plan(order, drop.start);
                },
                onOut: (drop: SchedulerDropOutside) => {
                    if (!drop.target?.closest('[data-unplanned]')) return;
                    const event = drop.event;
                    items.value = items.value.filter((item) => item.id !== event.id);
                    const minutes = (new Date(event.end).getTime() - new Date(event.start).getTime()) / 60_000;
                    orders.value = [...orders.value, { id: event.id, title: event.title, duration: minutes }];
                },
                onChange: (change: SchedulerChange) => (items.value = applyEventChange(items.value, change)),
                confirm: () => {
                    if (planning.value && when.value) plan(planning.value, when.value);
                    planning.value = null;
                },
            };
        },
        template: `
            <div class="flex max-w-6xl gap-4">
                <section data-unplanned class="flex w-60 shrink-0 flex-col gap-2 rounded-xl border border-line p-3">
                    <h2 class="text-sm font-semibold">Unplanned orders</h2>
                    <p v-if="orders.length === 0" class="text-xs text-muted">All scheduled.</p>
                    <ul class="flex flex-col gap-2">
                        <li v-for="order in orders" :key="order.id" draggable="true" class="flex cursor-grab flex-col gap-1 rounded-md border border-line bg-card p-2 text-sm" @dragstart="onDragStart($event, order)">
                            <span>{{ order.title }}</span>
                            <span class="text-xs text-muted">{{ order.duration }} minutes</span>
                            <Button size="sm" variant="outline" @click="planning = order">Schedule…</Button>
                        </li>
                    </ul>
                </section>
                <Scheduler v-bind="args" class="min-w-0 flex-1" :events="items" droppable @external-drop="onDrop" @event-drop-outside="onOut" @event-change="onChange" />
                <Dialog :open="!!planning" @update:open="!$event && (planning = null)">
                    <DialogContent :title="planning ? 'Schedule: ' + planning.title : ''">
                        <DatePicker v-model="when" with-time aria-label="Start" />
                        <template #footer>
                            <Button variant="outline" size="sm" @click="planning = null">Cancel</Button>
                            <Button size="sm" @click="confirm">Schedule</Button>
                        </template>
                    </DialogContent>
                </Dialog>
            </div>`,
    }),
};
