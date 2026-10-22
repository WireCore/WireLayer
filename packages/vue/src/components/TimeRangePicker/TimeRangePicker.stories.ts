import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Field from '../Field/Field.vue';
import TimeRangePicker, { type TimeRange } from './TimeRangePicker.vue';

const meta = {
    title: 'Forms/TimeRangePicker',
    component: TimeRangePicker,
    args: { min: '06:00', max: '22:00', disabled: false, invalid: false },
    render: (args) => ({
        components: { Field, TimeRangePicker },
        setup: () => ({ args, value: ref<TimeRange | null>({ start: '09:00', end: '17:30' }) }),
        template: `
            <div class="flex w-64 flex-col gap-3">
                <Field label="Working hours" helper-text="Paste also works: 08:00 – 16:00">
                    <TimeRangePicker v-bind="args" v-model="value" />
                </Field>
                <span class="text-xs text-muted">From: {{ value?.start ?? '–' }} · To: {{ value?.end ?? '–' }}</span>
            </div>`,
    }),
} satisfies Meta<typeof TimeRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** 12 hours with AM/PM */
export const TwelveHours: Story = { name: '12 hours', args: { hourCycle: 'h12' } };
