import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../Button/Button.vue';
import Banner from './Banner.vue';

const meta = {
    title: 'Feedback/Banner',
    component: Banner,
    args: { variant: 'warn', title: 'Maintenance', dismissible: true },
    argTypes: {
        variant: { control: 'inline-radio', options: ['info', 'success', 'warn', 'danger', 'neutral'] },
        position: { control: 'inline-radio', options: ['inline', 'top', 'bottom'] },
    },
    parameters: { layout: 'fullscreen' },
    render: (args) => ({
        components: { Banner },
        setup: () => ({ args }),
        template: `<Banner v-bind="args">The customer portal is unavailable on Saturday from 10 to 11 PM.</Banner>`,
    }),
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Every variant; danger is an alert (role="alert"), the others are announced politely (role="status") */
export const Variants: Story = {
    render: () => ({
        components: { Banner },
        template: `
            <div class="flex flex-col gap-3">
                <Banner variant="info">New features in the customer portal – available to everyone today.</Banner>
                <Banner variant="success" title="Done">Your data has been transferred.</Banner>
                <Banner variant="warn" title="Maintenance">Limited availability Saturday 10–11 PM.</Banner>
                <Banner variant="danger" title="Outage">Payment processing is down. We are working on it.</Banner>
                <Banner variant="neutral">Trial ends in 5 days.</Banner>
            </div>`,
    }),
};

/** With actions; the dismissal is remembered (storageKey) – reload the page and it stays hidden */
export const Remembered: Story = {
    render: () => ({
        components: { Banner, Button },
        template: `
            <Banner variant="info" title="Cookies" dismissible storage-key="wirecore-story-banner">
                We only use technically necessary cookies.
                <template #actions>
                    <Button size="sm" variant="outline">Settings</Button>
                    <Button size="sm">Accept all</Button>
                </template>
            </Banner>`,
    }),
};

/** Fixed at the top of the window */
export const Top: Story = {
    render: () => ({
        components: { Banner },
        template: `
            <div class="min-h-64 p-6 pt-16">
                <Banner variant="neutral" position="top" dismissible>You are viewing a preview.</Banner>
                <p class="text-sm text-muted">Page content</p>
            </div>`,
    }),
};
