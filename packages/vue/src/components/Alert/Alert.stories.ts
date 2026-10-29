import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from '../Button/Button.vue';
import Alert from './Alert.vue';

const meta = {
    title: 'Feedback/Alert',
    component: Alert,
    args: { status: 'info', title: 'Maintenance window', dismissible: true },
    argTypes: {
        status: { control: 'inline-radio', options: ['neutral', 'success', 'info', 'warn', 'danger'] },
        variant: { control: 'inline-radio', options: ['box', 'simple'] },
        size: { control: 'inline-radio', options: ['sm', 'md'] },
        onDismiss: { action: 'dismiss' },
    },
    render: (args) => ({
        components: { Alert },
        setup: () => ({ args }),
        template: '<Alert v-bind="args" class="w-[420px]">On Sunday from 2:00 to 4:00 AM.</Alert>',
    }),
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Statuses: Story = {
    render: () => ({
        components: { Alert },
        template: `
            <div class="flex w-[420px] flex-col gap-2.5">
                <Alert status="success" title="Deployment succeeded" dismissible>customer-portal · v2.4.1 is live.</Alert>
                <Alert status="info" title="Maintenance window" dismissible>On Sunday from 2:00 to 4:00 AM.</Alert>
                <Alert status="warn" title="High load" dismissible>web-02 has been above 85% for 10 minutes.</Alert>
                <Alert status="danger" title="Build failed" dismissible>The test step exited with code 1.</Alert>
            </div>`,
    }),
};

/** Neutral status for hints without urgency */
export const Neutral: Story = {
    args: { status: 'neutral', title: 'Draft', dismissible: false },
    render: (args) => ({
        components: { Alert },
        setup: () => ({ args }),
        template: '<Alert v-bind="args" class="w-[420px]">The page is not published yet.</Alert>',
    }),
};

/** Only icon and text in the status color – e.g. below a field or in dense layouts */
export const Simple: Story = {
    render: () => ({
        components: { Alert },
        template: `
            <div class="flex w-[420px] flex-col gap-2.5">
                <Alert variant="simple" status="danger">Please enter a valid email address.</Alert>
                <Alert variant="simple" status="success" size="sm">Saved.</Alert>
                <Alert variant="simple" status="neutral" size="sm">Last changed 5 minutes ago.</Alert>
            </div>`,
    }),
};

export const Sizes: Story = {
    render: () => ({
        components: { Alert },
        template: `
            <div class="flex w-[420px] flex-col gap-2.5">
                <Alert size="sm" status="info" title="Small" dismissible>Compact for tables and sidebars.</Alert>
                <Alert status="info" title="Medium" dismissible>Default size.</Alert>
            </div>`,
    }),
};

/** Dismisses itself after 8 seconds – the time stops while the pointer is over it or the focus is in it */
export const Duration: Story = {
    render: () => ({
        components: { Alert },
        setup: () => ({ shown: ref(true) }),
        template: `
            <div class="flex w-[420px] flex-col items-start gap-2.5">
                <Alert v-if="shown" status="success" title="Link copied" :duration="8000" dismissible @dismiss="shown = false">
                    Disappears after 8 seconds, pauses on hover and focus.
                </Alert>
                <button v-else type="button" class="text-sm underline" @click="shown = true">Show again</button>
            </div>`,
    }),
};

/** `#actions`: buttons in the message – beside the text, below it when there is little room */
export const WithActions: Story = {
    name: 'With actions',
    render: () => ({
        components: { Alert, Button },
        template: `
            <div class="flex w-[480px] flex-col gap-2.5">
                <Alert status="warn" title="Workspace locked">
                    Unlock it to see the connections.
                    <template #actions><Button size="sm">Unlock</Button></template>
                </Alert>
                <Alert status="danger" title="Connection lost" dismissible>
                    web-01 stopped answering.
                    <template #actions><Button size="sm" variant="outline">Reconnect</Button></template>
                </Alert>
                <div class="w-64">
                    <Alert status="info" size="sm" title="Update ready">
                        <template #actions><Button size="sm" variant="outline">Restart</Button></template>
                    </Alert>
                </div>
            </div>`,
    }),
};
