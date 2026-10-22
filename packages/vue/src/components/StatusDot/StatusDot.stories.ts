import type { Meta, StoryObj } from '@storybook/vue3-vite';
import StatusDot from './StatusDot.vue';

const meta = {
    title: 'Feedback/StatusDot',
    component: StatusDot,
    args: { status: 'success', pulse: true },
    argTypes: {
        status: { control: 'inline-radio', options: ['neutral', 'success', 'info', 'warn', 'danger'] },
    },
    render: (args) => ({
        components: { StatusDot },
        setup: () => ({ args }),
        template: '<StatusDot v-bind="args">ONLINE</StatusDot>',
    }),
} satisfies Meta<typeof StatusDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Overview: Story = {
    render: () => ({
        components: { StatusDot },
        template: `
            <div class="flex flex-wrap items-center gap-2">
                <StatusDot status="success" pulse>ONLINE</StatusDot>
                <StatusDot status="info">MAINTENANCE</StatusDot>
                <StatusDot status="warn">HIGH LOAD</StatusDot>
                <StatusDot status="danger">OFFLINE</StatusDot>
                <StatusDot>PAUSED</StatusDot>
            </div>`,
    }),
};

/** Status icon instead of the dot: shape, color and text together (never color alone) */
export const Icons: Story = {
    render: () => ({
        components: { StatusDot },
        template: `
            <div class="flex flex-wrap items-center gap-2">
                <StatusDot status="success" icon>ACTIVE</StatusDot>
                <StatusDot status="info" icon>PLANNED</StatusDot>
                <StatusDot status="warn" icon>DELAYED</StatusDot>
                <StatusDot status="danger" icon>DISRUPTED</StatusDot>
                <StatusDot icon>INACTIVE</StatusDot>
            </div>`,
    }),
};
