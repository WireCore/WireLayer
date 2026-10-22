import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../Button/Button.vue';
import Result from './Result.vue';

const meta = {
    title: 'Feedback/Result',
    component: Result,
    args: { status: '404' },
    argTypes: {
        status: { control: 'select', options: ['success', 'info', 'warn', 'error', '403', '404', '500'] },
    },
    render: (args) => ({
        components: { Button, Result },
        setup: () => ({ args }),
        template: `
            <Result v-bind="args">
                <template #actions>
                    <Button variant="outline">Back</Button>
                    <Button>Go to home page</Button>
                </template>
            </Result>`,
    }),
} satisfies Meta<typeof Result>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Error page with code, default title and text */
export const Playground: Story = {};

/** After a form: own title and text, extra content */
export const Success: Story = {
    render: () => ({
        components: { Button, Result },
        template: `
            <Result
                status="success"
                title="Order placed"
                description="You will receive a confirmation email in a few minutes."
            >
                <p class="rounded-lg bg-bg-2 px-4 py-2 font-mono text-sm">Order number 2026-4711</p>
                <template #actions><Button>Go to overview</Button></template>
            </Result>`,
    }),
};

/** All states */
export const Statuses: Story = {
    render: () => ({
        components: { Result },
        setup: () => ({ statuses: ['success', 'info', 'warn', 'error', '403', '404', '500'] }),
        template: `
            <div class="grid gap-4 sm:grid-cols-2">
                <Result v-for="status in statuses" :key="status" :status="status" :heading-level="3" class="rounded-xl border border-line" />
            </div>`,
    }),
};
