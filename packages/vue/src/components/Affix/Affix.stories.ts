import { MessageCircle } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../Button/Button.vue';
import Affix from './Affix.vue';

const meta = {
    title: 'Layout/Affix',
    component: Affix,
    args: { position: 'bottom-end' },
    argTypes: {
        position: { control: 'inline-radio', options: ['bottom-end', 'bottom-start', 'top-end', 'top-start'] },
    },
    parameters: { layout: 'fullscreen' },
    render: (args) => ({
        components: { Affix, Button },
        setup: () => ({ args, MessageCircle }),
        template: `
            <div class="min-h-64 p-6">
                <p class="text-sm text-muted">The button stays in the corner of the window.</p>
                <Affix v-bind="args"><Button :leading-icon="MessageCircle">Help</Button></Affix>
            </div>`,
    }),
} satisfies Meta<typeof Affix>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fixed in a corner of the window */
export const Playground: Story = {};
