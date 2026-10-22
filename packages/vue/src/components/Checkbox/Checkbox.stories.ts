import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Checkbox from './Checkbox.vue';

const meta = {
    title: 'Forms/Checkbox',
    component: Checkbox,
    args: { disabled: false, invalid: false, required: false },
    render: (args) => ({
        components: { Checkbox },
        setup: () => ({ args }),
        template: `
            <Checkbox v-bind="args" class="max-w-[380px]">
                I agree that my details may be processed to answer my inquiry.
            </Checkbox>`,
    }),
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
    render: () => ({
        components: { Checkbox },
        template: `
            <div class="flex flex-col gap-3">
                <Checkbox>Not selected</Checkbox>
                <Checkbox default-checked>Selected</Checkbox>
                <Checkbox checked="indeterminate">Partially selected</Checkbox>
                <Checkbox invalid>Invalid</Checkbox>
                <Checkbox disabled>Disabled</Checkbox>
            </div>`,
    }),
};
