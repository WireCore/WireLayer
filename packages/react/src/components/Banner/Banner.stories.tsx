import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button/Button.js';
import { Banner } from './Banner.js';

const meta = {
    title: 'Feedback/Banner',
    component: Banner,
    args: {
        variant: 'warn',
        title: 'Maintenance',
        children: 'The customer portal is unavailable on Saturday from 10 to 11 PM.',
        dismissible: true,
    },
    argTypes: {
        variant: { control: 'inline-radio', options: ['info', 'success', 'warn', 'danger', 'neutral'] },
        position: { control: 'inline-radio', options: ['inline', 'top', 'bottom'] },
    },
    parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Every variant; danger is an alert (role="alert"), the others are announced politely (role="status") */
export const Variants: Story = {
    render: () => (
        <div className="flex flex-col gap-3">
            <Banner variant="info">New features in the customer portal – available to everyone today.</Banner>
            <Banner variant="success" title="Done">
                Your data has been transferred.
            </Banner>
            <Banner variant="warn" title="Maintenance">
                Limited availability Saturday 10–11 PM.
            </Banner>
            <Banner variant="danger" title="Outage">
                Payment processing is down. We are working on it.
            </Banner>
            <Banner variant="neutral">Trial ends in 5 days.</Banner>
        </div>
    ),
};

/** With actions; the dismissal is remembered (storageKey) – reload the page and it stays hidden */
export const Remembered: Story = {
    render: () => (
        <Banner
            variant="info"
            title="Cookies"
            dismissible
            storageKey="wirecore-story-banner"
            actions={
                <>
                    <Button size="sm" variant="outline">
                        Settings
                    </Button>
                    <Button size="sm">Accept all</Button>
                </>
            }
        >
            We only use technically necessary cookies.
        </Banner>
    ),
};

/** Fixed at the top of the window */
export const Top: Story = {
    render: () => (
        <div className="min-h-64 p-6 pt-16">
            <Banner variant="neutral" position="top" dismissible>
                You are viewing a preview.
            </Banner>
            <p className="text-sm text-muted">Page content</p>
        </div>
    ),
};
