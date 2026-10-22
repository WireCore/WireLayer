import { Filter } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import ToggleButton from './ToggleButton.vue';

const meta = {
    title: 'Buttons/ToggleButton',
    component: ToggleButton,
    args: { size: 'md', disabled: false },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
    render: (args) => ({
        components: { ToggleButton },
        setup: () => ({ args, Filter, pressed: ref(false) }),
        template: `
            <div class="flex flex-col items-start gap-3">
                <ToggleButton v-bind="args" v-model:pressed="pressed" :icon="Filter">Active only</ToggleButton>
                <span class="text-xs text-muted">Pressed: {{ pressed ? 'yes' : 'no' }}</span>
            </div>`,
    }),
} satisfies Meta<typeof ToggleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
