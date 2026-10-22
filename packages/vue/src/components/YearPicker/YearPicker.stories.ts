import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { PeriodRange } from '@wirecore/wirelayer-recipes';
import { ref, type ConcreteComponent } from 'vue';
import Field from '../Field/Field.vue';
import YearPickerComponent from './YearPicker.vue';

// Generic component: Storybook's Vue types can't infer args here
const YearPicker = YearPickerComponent as unknown as ConcreteComponent;

const meta = {
    title: 'Forms/YearPicker',
    component: YearPicker,
    args: { min: '2015', max: '2035', disabled: false, invalid: false },
    render: (args) => ({
        components: { Field, YearPicker },
        setup: () => ({ args, value: ref<string | null>('2026') }),
        template: `
            <div class="flex w-48 flex-col gap-3">
                <Field label="Fiscal year"><YearPicker v-bind="args" v-model="value" /></Field>
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
        components: { Field, YearPicker },
        setup: () => ({
            presets: ['thisYear', 'lastYear', 'last3Years', 'last5Years'],
            value: ref<PeriodRange | null>({ start: '2024', end: '2026' }),
        }),
        template: `
            <div class="flex w-60 flex-col gap-3">
                <Field label="Fiscal years">
                    <YearPicker v-model="value" range min="2015" max="2035" :presets="presets" />
                </Field>
                <span class="text-xs text-muted">From: {{ value?.start ?? '–' }} · To: {{ value?.end ?? '–' }}</span>
            </div>`,
    }),
};
