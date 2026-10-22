import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Field from '../Field/Field.vue';
import TimePicker from './TimePicker.vue';

const meta = {
    title: 'Forms/TimePicker',
    component: TimePicker,
    args: { step: 30, min: '07:00', max: '19:00', disabled: false, invalid: false },
    render: (args) => ({
        components: { Field, TimePicker },
        setup: () => ({ args, value: ref<string | null>('09:30') }),
        template: `
            <div class="flex w-48 flex-col gap-3">
                <Field label="Start" helper-text="Between 7 AM and 7 PM"><TimePicker v-bind="args" v-model="value" /></Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const QuarterHours: Story = { args: { step: 15, min: undefined, max: undefined } };

/** `withSeconds`: hour, minute and second ("HH:mm:ss") */
export const WithSeconds: Story = {
    name: 'With seconds',
    render: () => ({
        components: { Field, TimePicker },
        setup: () => ({ value: ref<string | null>('09:30:15') }),
        template: `
            <div class="flex w-56 flex-col gap-3">
                <Field label="Start time"><TimePicker v-model="value" with-seconds :step="15" /></Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
};

/** `hourCycle: 'h12'`: 12 hours with AM/PM in field and list – the value stays "HH:mm" */
export const TwelveHours: Story = {
    name: '12 hours',
    render: () => ({
        components: { Field, TimePicker },
        setup: () => ({ value: ref<string | null>('14:30') }),
        template: `
            <div class="flex w-56 flex-col gap-3">
                <Field label="Start"><TimePicker v-model="value" hour-cycle="h12" /></Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
};

/** `options`: own times for the list, optionally named */
export const Options: Story = {
    name: 'Custom times',
    render: () => ({
        components: { Field, TimePicker },
        setup: () => ({
            value: ref<string | null>(null),
            options: [
                { value: '08:00', label: '08:00 – Early shift' },
                { value: '14:00', label: '14:00 – Late shift' },
                { value: '22:00', label: '22:00 – Night shift' },
            ],
        }),
        template: `
            <div class="flex w-56 flex-col gap-3">
                <Field label="Shift start"><TimePicker v-model="value" :options="options" /></Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
};

/** `timeZone`: the time is typed in the zone, the value carries its offset ("14:30-05:00") */
export const TimeZone: Story = {
    name: 'Time zone',
    render: () => ({
        components: { Field, TimePicker },
        setup: () => ({ value: ref<string | null>('15:00Z') }),
        template: `
            <div class="flex w-56 flex-col gap-3">
                <Field label="Call (New York)">
                    <TimePicker v-model="value" time-zone="America/New_York" reference-date="2026-11-10" show-time-zone />
                </Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
};
