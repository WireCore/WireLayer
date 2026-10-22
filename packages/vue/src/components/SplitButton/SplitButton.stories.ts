import { Copy, Save, Send } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import SplitButton from './SplitButton.vue';

const items = [
    { value: 'save-draft', label: 'Save as draft', icon: Save },
    { value: 'save-copy', label: 'Save as copy', icon: Copy },
];

const meta = {
    title: 'Buttons/SplitButton',
    component: SplitButton,
    args: { label: 'Send', icon: Send, items, variant: 'primary', size: 'md', disabled: false },
    argTypes: {
        items: { control: false },
        icon: { control: false },
        variant: { control: 'inline-radio', options: ['primary', 'secondary', 'outline', 'soft', 'danger'] },
        color: {
            control: 'select',
            options: [undefined, 'primary', 'secondary', 'success', 'info', 'warn', 'danger', 'contrast'],
        },
        size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg'] },
        shape: { control: 'inline-radio', options: ['pill', 'rounded', 'square'] },
    },
    render: (args) => ({
        components: { SplitButton },
        setup: () => ({ args, action: ref('') }),
        template: `
            <div class="flex flex-col items-start gap-3">
                <SplitButton v-bind="args" @click="action = 'send'" @select="action = $event" />
                <p class="h-4 text-xs text-muted" aria-live="polite">{{ action && 'Action: ' + action }}</p>
            </div>`,
    }),
} satisfies Meta<typeof SplitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Outline: Story = { args: { variant: 'outline' } };

/** Color and shape like Button: here a danger outline with rounded corners */
export const ColorAndShape: Story = {
    args: { variant: 'outline', color: 'danger', shape: 'rounded', label: 'Delete' },
};
