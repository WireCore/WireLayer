import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Checkbox from '../Checkbox/Checkbox.vue';
import CheckboxGroup from './CheckboxGroup.vue';

const meta = {
    title: 'Forms/CheckboxGroup',
    component: CheckboxGroup,
    args: { label: 'Notifications', helperText: 'Choose how we can reach you.' },
    argTypes: { orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] } },
    render: (args) => ({
        components: { Checkbox, CheckboxGroup },
        setup() {
            const value = ref(['mail']);
            return { args, value };
        },
        template: `
            <div class="flex flex-col gap-3">
                <CheckboxGroup v-bind="args" v-model="value" name="channels">
                    <Checkbox value="mail">Email</Checkbox>
                    <Checkbox value="sms">SMS</Checkbox>
                    <Checkbox value="push">Push notification</Checkbox>
                </CheckboxGroup>
                <p class="text-xs text-muted">Value: {{ value.join(', ') }}</p>
            </div>`,
    }),
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One value for the group (string[]), named by its label, described by the helper text */
export const Playground: Story = {};

/** At most two: the others are disabled until one is unticked (announced) */
export const Maximum: Story = { args: { max: 2, helperText: 'At most two channels' } };

/** Side by side, with an error */
export const ErrorState: Story = {
    name: 'Error',
    args: { orientation: 'horizontal', required: true, error: 'Select at least one channel' },
};
