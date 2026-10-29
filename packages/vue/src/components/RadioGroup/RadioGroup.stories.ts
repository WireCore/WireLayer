import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, type ConcreteComponent } from 'vue';
import RadioGroupComponent from './RadioGroup.vue';
import RadioGroupItem from './RadioGroupItem.vue';

// Generic component: Storybook's Vue types can't infer args here
const RadioGroup = RadioGroupComponent as unknown as ConcreteComponent;

const meta = {
    title: 'Forms/RadioGroup',
    component: RadioGroup,
    args: { label: 'Company size', defaultValue: 'midsize', orientation: 'horizontal', disabled: false },
    argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] } },
    render: (args) => ({
        components: { RadioGroup, RadioGroupItem },
        setup: () => ({ args }),
        template: `
            <RadioGroup v-bind="args">
                <RadioGroupItem value="startup">Startup</RadioGroupItem>
                <RadioGroupItem value="midsize">Mid-sized</RadioGroupItem>
                <RadioGroupItem value="enterprise">Enterprise</RadioGroupItem>
                <RadioGroupItem value="public-sector" disabled>Public sector</RadioGroupItem>
            </RadioGroup>`,
    }),
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Number values: v-model gets numbers back (`RadioGroup<number>`, typed by the bound value) */
export const NumberValues: Story = {
    name: 'Number values',
    render: () => ({
        components: { RadioGroup, RadioGroupItem },
        setup: () => ({ timeout: ref(30) }),
        template: `
            <div class="flex flex-col gap-3">
                <RadioGroup v-model="timeout" label="Idle timeout">
                    <RadioGroupItem :value="15">15 s</RadioGroupItem>
                    <RadioGroupItem :value="30">30 s</RadioGroupItem>
                    <RadioGroupItem :value="60">60 s</RadioGroupItem>
                </RadioGroup>
                <span class="text-xs text-muted">Value: {{ timeout }} ({{ typeof timeout }})</span>
            </div>`,
    }),
};
