import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { PeriodRange } from '@wirecore/wirelayer-recipes';
import { ref, type ConcreteComponent } from 'vue';
import Field from '../Field/Field.vue';
import MonthPickerComponent from './MonthPicker.vue';

// Generic component: Storybook's Vue types can't infer args here
const MonthPicker = MonthPickerComponent as unknown as ConcreteComponent;

const meta = {
    title: 'Forms/MonthPicker',
    component: MonthPicker,
    args: { min: '2025-01', max: '2027-12', disabled: false, invalid: false },
    render: (args) => ({
        components: { Field, MonthPicker },
        setup: () => ({ args, value: ref<string | null>('2026-10') }),
        template: `
            <div class="flex w-56 flex-col gap-3">
                <Field label="Billing month"><MonthPicker v-bind="args" v-model="value" /></Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

/** `range`: start and end in one field; presets below the grid */
export const Range: Story = {
    name: 'Range',
    render: () => ({
        components: { Field, MonthPicker },
        setup: () => ({
            presets: ['thisMonth', 'lastMonth', 'last3Months', 'thisQuarter', 'lastQuarter', 'thisYear'],
            value: ref<PeriodRange | null>({ start: '2026-07', end: '2026-09' }),
        }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Field label="Billing period">
                    <MonthPicker v-model="value" range min="2025-01" max="2027-12" :presets="presets" />
                </Field>
                <span class="text-xs text-muted">From: {{ value?.start ?? '–' }} · To: {{ value?.end ?? '–' }}</span>
            </div>`,
    }),
};
