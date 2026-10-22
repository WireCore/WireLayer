import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, type ConcreteComponent } from 'vue';
import MiniCalendar from '../MiniCalendar/MiniCalendar.vue';
import type { TimeRange } from '../TimeRangePicker/TimeRangePicker.vue';
import TimeGridComponent from './TimeGrid.vue';

// Generic component: Storybook's Vue types can't infer args here
const TimeGrid = TimeGridComponent as unknown as ConcreteComponent;

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
    render: (args) => ({
        components: { TimeGrid },
        setup: () => ({ args, value: ref<string | null>('09:30') }),
        template: `
            <div class="flex w-[28rem] flex-col gap-3">
                <TimeGrid v-bind="args" v-model="value" />
                <span class="text-xs text-muted">Selected: {{ value ?? '–' }}</span>
            </div>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

/** `range`: start slot, then end slot – the slots between are marked */
export const Range: Story = {
    name: 'Range',
    render: () => ({
        components: { TimeGrid },
        setup: () => ({ value: ref<TimeRange | null>({ start: '14:00', end: '15:30' }) }),
        template: `
            <div class="flex w-[28rem] flex-col gap-3">
                <TimeGrid v-model="value" range start="13:00" end="18:00" label="Room Elbe" :disabled-times="['16:00']" />
                <span class="text-xs text-muted">From: {{ value?.start ?? '–' }} · To: {{ value?.end ?? '–' }}</span>
            </div>`,
    }),
};

export const Loading: Story = { name: 'Loading', args: { loading: true } };

/** Booking: a day from the strip, then a free time */
export const Booking: Story = {
    name: 'Appointment booking',
    render: () => ({
        components: { MiniCalendar, TimeGrid },
        setup: () => ({
            day: ref<string | null>('2026-11-10'),
            time: ref<string | null>(null),
            weekend: (date: string) => [0, 6].includes(new Date(date).getDay()),
        }),
        template: `
            <div class="flex w-[28rem] flex-col gap-4">
                <MiniCalendar v-model="day" start-date="2026-11-09" label="Day" :is-date-unavailable="weekend" />
                <TimeGrid v-model="time" start="09:00" end="12:00" :disabled-times="day === '2026-11-10' ? ['09:30'] : []" />
                <span class="text-xs text-muted">Appointment: {{ day ?? '–' }} {{ time ?? '' }}</span>
            </div>`,
    }),
};
