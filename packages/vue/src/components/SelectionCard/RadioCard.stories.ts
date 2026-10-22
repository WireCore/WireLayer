import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Building2, Rocket, User } from '@lucide/vue';
import { ref } from 'vue';
import RadioGroup from '../RadioGroup/RadioGroup.vue';
import RadioCard from './RadioCard.vue';

const meta = {
    title: 'Forms/RadioCard',
    component: RadioCard,
    args: { value: 'pro', title: 'Pro' },
    render: () => ({
        components: { RadioCard, RadioGroup },
        setup() {
            const value = ref('pro');
            return { value, Building2, Rocket, User };
        },
        template: `
            <div class="flex w-[min(760px,90vw)] flex-col gap-3">
                <RadioGroup v-model="value" label="Plan" :columns="3" name="plan">
                    <RadioCard value="basic" title="Basic" description="For individuals" price="€0" :icon="User" />
                    <RadioCard value="pro" title="Pro" description="For teams of up to 20" price="€29 / month" :icon="Rocket" />
                    <RadioCard value="enterprise" title="Enterprise" description="Custom contracts, SLA" price="on request" :icon="Building2" />
                </RadioGroup>
                <p class="text-xs text-muted">Value: {{ value }}</p>
            </div>`,
    }),
} satisfies Meta<typeof RadioCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Cards as the options of a RadioGroup (arrow keys move, a grid with `columns`) */
export const Playground: Story = {};
