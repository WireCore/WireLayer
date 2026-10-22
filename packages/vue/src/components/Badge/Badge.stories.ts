import { CircleCheck, Info, OctagonX, TriangleAlert } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Badge from './Badge.vue';

const meta = {
    title: 'Data/Badge',
    component: Badge,
    args: { variant: 'soft' },
    argTypes: {
        variant: { control: 'select', options: ['solid', 'soft', 'outline', 'success', 'info', 'warn', 'danger'] },
        icon: { control: false },
    },
    render: (args) => ({
        components: { Badge },
        setup: () => ({ args }),
        template: '<Badge v-bind="args">BETA</Badge>',
    }),
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Overview: Story = {
    render: () => ({
        components: { Badge },
        setup: () => ({ CircleCheck, Info, OctagonX, TriangleAlert }),
        template: `
            <div class="flex flex-wrap items-center gap-1.5">
                <Badge variant="solid">NEW</Badge>
                <Badge>BETA</Badge>
                <Badge variant="outline">v2.4.1</Badge>
                <Badge variant="success" :icon="CircleCheck">Online</Badge>
                <Badge variant="info" :icon="Info">Maintenance</Badge>
                <Badge variant="warn" :icon="TriangleAlert">High load</Badge>
                <Badge variant="danger" :icon="OctagonX">Offline</Badge>
            </div>`,
    }),
};

/** Round badge for a count or a single character */
export const Circle: Story = {
    render: () => ({
        components: { Badge },
        template: `
            <div class="flex flex-wrap items-center gap-1.5">
                <Badge variant="solid" circle>4</Badge>
                <Badge variant="danger" circle>12</Badge>
                <Badge variant="outline" circle>A</Badge>
            </div>`,
    }),
};
