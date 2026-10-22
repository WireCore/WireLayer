import type { Meta, StoryObj } from '@storybook/vue3-vite';
import RadioGroup from './RadioGroup.vue';
import RadioGroupItem from './RadioGroupItem.vue';

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
