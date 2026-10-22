import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Field from '../Field/Field.vue';
import DurationInput from './DurationInput.vue';

const meta = {
    title: 'Forms/DurationInput',
    component: DurationInput,
    args: { valueType: 'minutes', withDays: false, withSeconds: false, disabled: false, invalid: false },
    argTypes: { valueType: { control: 'inline-radio', options: ['minutes', 'seconds', 'iso'] } },
    render: (args) => ({
        components: { DurationInput, Field },
        setup: () => ({ args, value: ref<number | string | null>(150) }),
        template: `
            <div class="flex w-64 flex-col gap-3">
                <Field label="Effort" helper-text="Hours and minutes, also over 24 hours">
                    <DurationInput v-bind="args" v-model="value" />
                </Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
} satisfies Meta<typeof DurationInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Days, hours, minutes and seconds; the value as ISO 8601 duration ("P1DT2H30M") */
export const DaysAndSeconds: Story = {
    name: 'With days and seconds (ISO)',
    render: () => ({
        components: { DurationInput, Field },
        setup: () => ({ value: ref<number | string | null>('P1DT2H30M') }),
        template: `
            <div class="flex w-80 flex-col gap-3">
                <Field label="Runtime"><DurationInput v-model="value" value-type="iso" with-days with-seconds /></Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
};
