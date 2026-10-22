import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, type ConcreteComponent } from 'vue';
import CalendarComponent from './Calendar.vue';

// Generic component: Storybook's Vue types can't infer args here
const Calendar = CalendarComponent as unknown as ConcreteComponent;

const meta = {
    title: 'Forms/Calendar',
    component: Calendar,
    args: { selectionMode: 'multiple', min: '2026-01-01', max: '2027-12-31' },
    argTypes: { selectionMode: { control: 'inline-radio', options: ['single', 'multiple', 'range'] } },
    render: (args) => ({
        components: { Calendar },
        setup: () => ({ args, value: ref(['2026-10-20', '2026-10-22']) }),
        template: `
            <div class="flex flex-col gap-3">
                <Calendar v-bind="args" v-model="value" />
                <span class="text-xs text-muted">Selected: {{ value.join(', ') || '–' }}</span>
            </div>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

export const Range: Story = { args: { selectionMode: 'range', presets: ['last7Days', 'thisMonth'] } };

/** Calendar weeks (ISO), "Today"/"Clear" below; `allowDeselect`: the chosen day again clears it */
export const WeekNumbers: Story = {
    name: 'Week numbers',
    args: { selectionMode: 'single', showWeekNumbers: true, showButtonBar: true, allowDeselect: true },
    render: (args) => ({
        components: { Calendar },
        setup: () => ({ args, value: ref(['2026-11-10']) }),
        template: `
            <div class="flex flex-col gap-3">
                <Calendar v-bind="args" v-model="value" />
                <span class="text-xs text-muted">Selected: {{ value.join(', ') || '–' }}</span>
            </div>`,
    }),
};

/** Two months side by side; the days of the neighbor months stay empty */
export const TwoMonths: Story = {
    name: 'Two months',
    args: { selectionMode: 'range', numberOfMonths: 2 },
    render: (args) => ({
        components: { Calendar },
        setup: () => ({ args, value: ref(['2026-11-26', '2026-12-04']) }),
        template: `<Calendar v-bind="args" v-model="value" />`,
    }),
};

/** Own content per day: a dot below days with events (keyboard and names stay as they are) */
export const DayContent: Story = {
    name: 'Mark events',
    render: () => ({
        components: { Calendar },
        setup: () => ({ value: ref(['2026-11-10']), busy: ['2026-11-04', '2026-11-12', '2026-11-19'] }),
        template: `
            <Calendar v-model="value">
                <template #day="{ date, day }">
                    {{ day }}
                    <span v-if="busy.includes(date)" aria-hidden="true" class="absolute bottom-0.5 size-1 rounded-full bg-current"></span>
                </template>
            </Calendar>`,
    }),
};
