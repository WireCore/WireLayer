import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, type ConcreteComponent } from 'vue';
import Field from '../Field/Field.vue';
import DatePickerComponent from './DatePicker.vue';

// Generic component: Storybook's Vue types can't infer args here
const DatePicker = DatePickerComponent as unknown as ConcreteComponent;

const meta = {
    title: 'Forms/DatePicker',
    component: DatePicker,
    args: { disabled: false, invalid: false, min: '2026-01-01', max: '2027-12-31' },
    render: (args) => ({
        components: { DatePicker, Field },
        setup: () => ({
            args,
            value: ref<string | null>('2026-10-20'),
            weekend: (date: string) => [0, 6].includes(new Date(date).getDay()),
        }),
        template: `
            <div class="flex w-64 flex-col gap-3">
                <Field label="Maintenance date" helper-text="Weekdays only">
                    <DatePicker v-bind="args" v-model="value" :is-date-unavailable="weekend" />
                </Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

export const WithTime: Story = {
    render: () => ({
        components: { DatePicker, Field },
        setup: () => ({ value: ref<string | null>('2026-10-20T14:30') }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Field label="Appointment"><DatePicker v-model="value" with-time /></Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
};

/** `size` sm, md and lg; `clearable: false` leaves out the clear button */
export const Sizes: Story = {
    name: 'Sizes',
    render: () => ({
        components: { DatePicker, Field },
        template: `
            <div class="flex w-64 flex-col gap-3">
                <Field label="Small"><DatePicker size="sm" default-value="2026-11-10" /></Field>
                <Field label="Medium"><DatePicker default-value="2026-11-10" /></Field>
                <Field label="Large, not clearable"><DatePicker size="lg" default-value="2026-11-10" :clearable="false" /></Field>
            </div>`,
    }),
};

/** `valueType: 'date'`: Date objects in and out (also for min/max) – for forms that work with Date */
export const DateObjects: Story = {
    name: 'Values as Date',
    render: () => ({
        components: { DatePicker, Field },
        setup: () => ({ value: ref<Date | null>(new Date(2026, 10, 10)), min: new Date(2026, 10, 2) }),
        template: `
            <div class="flex w-64 flex-col gap-3">
                <Field label="Delivery date" helper-text="Paste also works: 11/12/2026 or 2026-11-12">
                    <DatePicker v-model="value" value-type="date" :min="min" />
                </Field>
                <span class="text-xs text-muted">Value: {{ value ? value.toDateString() : '–' }}</span>
            </div>`,
    }),
};

/** Calendar weeks, "Today"/"Clear" below, two months side by side and a dot below days with events */
export const CalendarOptions: Story = {
    name: 'Week numbers, two months, events',
    render: () => ({
        components: { DatePicker, Field },
        setup: () => ({
            value: ref<string | null>('2026-11-10'),
            busy: ['2026-11-04', '2026-11-12', '2026-11-19', '2026-12-03'],
        }),
        template: `
            <div class="flex w-64 flex-col gap-3">
                <Field label="Meeting">
                    <DatePicker v-model="value" show-week-numbers show-button-bar :number-of-months="2" allow-deselect>
                        <template #day="{ date, day }">
                            {{ day }}
                            <span v-if="busy.includes(date)" aria-hidden="true" class="absolute bottom-0.5 size-1 rounded-full bg-current"></span>
                        </template>
                    </DatePicker>
                </Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
};

/** `selectionMode: 'multiple'`: several days – the field lists them, the calendar toggles days */
export const Multiple: Story = {
    name: 'Multiple days',
    render: () => ({
        components: { DatePicker, Field },
        setup: () => ({ value: ref<string[]>(['2026-11-10', '2026-11-12']) }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Field label="Training days"><DatePicker v-model="value" selection-mode="multiple" /></Field>
                <span class="text-xs text-muted">Value: {{ value.join(', ') || '–' }}</span>
            </div>`,
    }),
};

/** `timeZone`: typed in the zone, the value carries its offset; `showTimeZone` names the zone */
export const TimeZone: Story = {
    name: 'Time zone',
    render: () => ({
        components: { DatePicker, Field },
        setup: () => ({ value: ref<string | null>('2026-11-10T14:30Z') }),
        template: `
            <div class="flex w-80 flex-col gap-3">
                <Field label="Departure (New York)">
                    <DatePicker v-model="value" with-time time-zone="America/New_York" show-time-zone />
                </Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
};

/** `responsive`: on narrow screens the calendar opens as a sheet at the bottom */
export const Responsive: Story = {
    name: 'Mobile as sheet',
    render: () => ({
        components: { DatePicker, Field },
        template: `
            <div class="flex w-64 flex-col gap-3">
                <Field label="Arrival"><DatePicker default-value="2026-11-10" responsive /></Field>
            </div>`,
    }),
};
