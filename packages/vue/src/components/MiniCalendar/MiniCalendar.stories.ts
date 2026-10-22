import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, type ConcreteComponent } from 'vue';
import MiniCalendarComponent from './MiniCalendar.vue';

// Generic component: Storybook's Vue types can't infer args here
const MiniCalendar = MiniCalendarComponent as unknown as ConcreteComponent;

const meta = {
    title: 'Forms/MiniCalendar',
    component: MiniCalendar,
    args: { startDate: '2026-11-09', days: 7, min: '2026-11-05', disabled: false },
    render: (args) => ({
        components: { MiniCalendar },
        setup: () => ({ args, value: ref<string | null>('2026-11-10') }),
        template: `
            <div class="flex w-[28rem] flex-col gap-3">
                <MiniCalendar v-bind="args" v-model="value" label="Delivery day" />
                <span class="text-xs text-muted">Selected: {{ value ?? '–' }}</span>
            </div>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

/** Five working days per page */
export const WorkingDays: Story = { name: 'Five days', args: { days: 5 } };
