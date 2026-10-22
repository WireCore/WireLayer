import { Mail } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Avatar from '../Avatar/Avatar.vue';
import OverlayBadge from './OverlayBadge.vue';

const meta = {
    title: 'Data/OverlayBadge',
    component: OverlayBadge,
    args: { count: 3, max: 99, label: '3 unread messages' },
    render: (args) => ({
        components: { Avatar, OverlayBadge },
        setup: () => ({ args, Mail }),
        template: `
            <div class="flex items-center gap-8">
                <OverlayBadge v-bind="args"><Avatar name="Julia Klein" /></OverlayBadge>
                <OverlayBadge :count="120" label="120 new notifications"><component :is="Mail" class="size-6" aria-hidden="true" /></OverlayBadge>
                <OverlayBadge label="Online"><Avatar name="Max Schulz" variant="solid" /></OverlayBadge>
            </div>`,
    }),
} satisfies Meta<typeof OverlayBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
