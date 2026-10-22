import type { PeriodRange } from '@wirecore/wirelayer-recipes';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, type ConcreteComponent } from 'vue';
import Field from '../Field/Field.vue';
import QuarterPickerComponent from './QuarterPicker.vue';

// Generic component: Storybook's Vue types can't infer args here
const QuarterPicker = QuarterPickerComponent as unknown as ConcreteComponent;

const meta = {
    title: 'Forms/QuarterPicker',
    component: QuarterPicker,
    args: { min: '2024-Q1', max: '2028-Q4', disabled: false, invalid: false },
    render: (args) => ({
        components: { Field, QuarterPicker },
        setup: () => ({ args, value: ref<string | null>('2026-Q4') }),
        template: `
            <div class="flex w-56 flex-col gap-3">
                <Field label="Reporting quarter" helper-text="For example Q4 2026 or 4/2026">
                    <QuarterPicker v-bind="args" v-model="value" />
                </Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

/** `range`: start, then end quarter; presets like "Last quarter" or "This year" */
export const Range: Story = {
    name: 'Range',
    render: () => ({
        components: { Field, QuarterPicker },
        setup: () => ({
            presets: ['thisQuarter', 'lastQuarter', 'last4Quarters', 'thisYear', 'lastYear'],
            value: ref<PeriodRange | null>({ start: '2026-Q1', end: '2026-Q3' }),
        }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Field label="Comparison period">
                    <QuarterPicker v-model="value" range :presets="presets" />
                </Field>
                <span class="text-xs text-muted">From: {{ value?.start ?? '–' }} · To: {{ value?.end ?? '–' }}</span>
            </div>`,
    }),
};
