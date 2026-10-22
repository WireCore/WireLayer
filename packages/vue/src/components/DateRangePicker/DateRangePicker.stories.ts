import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, type ConcreteComponent } from 'vue';
import Field from '../Field/Field.vue';
import DateRangePickerComponent from './DateRangePicker.vue';
import type { DateRange } from './types.js';

// Generic component: Storybook's Vue types can't infer args here
const DateRangePicker = DateRangePickerComponent as unknown as ConcreteComponent;

const meta = {
    title: 'Forms/DateRangePicker',
    component: DateRangePicker,
    args: { disabled: false, invalid: false, withTime: false, min: '2026-01-01', max: '2027-12-31' },
    render: (args) => ({
        components: { DateRangePicker, Field },
        setup: () => ({ args, value: ref<DateRange | null>({ start: '2026-10-20', end: '2026-10-24' }) }),
        template: `
            <div class="flex w-80 flex-col gap-3">
                <Field label="Vacation"><DateRangePicker v-bind="args" v-model="value" /></Field>
                <span class="text-xs text-muted">From: {{ value?.start ?? '–' }} · To: {{ value?.end ?? '–' }}</span>
            </div>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

export const WithTime: Story = {
    render: () => ({
        components: { DateRangePicker, Field },
        setup: () => ({ value: ref<DateRange | null>({ start: '2026-10-20T09:00', end: '2026-10-20T17:30' }) }),
        template: `
            <div class="flex w-[26rem] flex-col gap-3">
                <Field label="Maintenance window"><DateRangePicker v-model="value" with-time /></Field>
                <span class="text-xs text-muted">From: {{ value?.start ?? '–' }} · To: {{ value?.end ?? '–' }}</span>
            </div>`,
    }),
};

/** Buttons for common ranges below the calendar */
export const Presets: Story = {
    args: { presets: ['last7Days', 'last30Days', 'thisMonth', 'lastMonth', 'thisQuarter'] },
};

/** Presets beyond days: months, quarters and years ("Last 3 months", "Last 12 months", "Last 3 years") */
export const MorePresets: Story = {
    name: 'Presets for months and years',
    args: {
        presets: ['thisMonth', 'last3Months', 'last12Months', 'thisQuarter', 'lastQuarter', 'thisYear', 'last3Years'],
    },
};

/** Two months side by side with calendar weeks – a range across the month end at a glance */
export const TwoMonths: Story = {
    name: 'Two months',
    render: () => ({
        components: { DateRangePicker, Field },
        setup: () => ({ value: ref<DateRange | null>({ start: '2026-11-26', end: '2026-12-04' }) }),
        template: `
            <div class="flex w-80 flex-col gap-3">
                <Field label="Project phase">
                    <DateRangePicker v-model="value" :number-of-months="2" show-week-numbers show-button-bar />
                </Field>
                <span class="text-xs text-muted">From: {{ value?.start ?? '–' }} · To: {{ value?.end ?? '–' }}</span>
            </div>`,
    }),
};
