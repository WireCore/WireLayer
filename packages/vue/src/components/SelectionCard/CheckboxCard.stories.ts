import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Archive, Activity, ShieldCheck } from '@lucide/vue';
import { ref } from 'vue';
import CheckboxGroup from '../CheckboxGroup/CheckboxGroup.vue';
import CheckboxCard from './CheckboxCard.vue';

const meta = {
    title: 'Forms/CheckboxCard',
    component: CheckboxCard,
    args: { title: 'Backup', description: 'Daily, kept for 30 days', price: '€9 / month' },
    render: (args) => ({
        components: { CheckboxCard },
        setup: () => ({ args, Archive }),
        template: `<CheckboxCard v-bind="args" :icon="Archive" class="w-80" />`,
    }),
} satisfies Meta<typeof CheckboxCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A card that is one checkbox: the title names it, description and price describe it */
export const Playground: Story = {};

/** Several cards in a CheckboxGroup with a grid (`columns`) */
export const Grid: Story = {
    name: 'Grid',
    render: () => ({
        components: { CheckboxCard, CheckboxGroup },
        setup() {
            const value = ref(['backup']);
            return { value, Archive, Activity, ShieldCheck };
        },
        template: `
            <div class="flex w-[min(760px,90vw)] flex-col gap-3">
                <CheckboxGroup v-model="value" label="Add-ons" :columns="3" helper-text="Cancel anytime">
                    <CheckboxCard value="backup" title="Backup" description="Daily, kept for 30 days" price="€9" :icon="Archive" />
                    <CheckboxCard value="monitoring" title="Monitoring" description="Alerts by email and SMS" price="€12" :icon="Activity" />
                    <CheckboxCard value="waf" title="Firewall" description="Protection against attacks" price="€19" :icon="ShieldCheck" disabled />
                </CheckboxGroup>
                <p class="text-xs text-muted">Value: {{ value.join(', ') }}</p>
            </div>`,
    }),
};
