import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { Alert } from './Alert.js';

const meta = {
    title: 'Feedback/Alert',
    component: Alert,
    args: {
        status: 'info',
        title: 'Maintenance window',
        dismissible: true,
        onDismiss: fn(),
        children: 'On Sunday from 2:00 to 4:00 AM.',
        className: 'w-[420px]',
    },
    argTypes: {
        status: { control: 'inline-radio', options: ['neutral', 'success', 'info', 'warn', 'danger'] },
        variant: { control: 'inline-radio', options: ['box', 'simple'] },
        size: { control: 'inline-radio', options: ['sm', 'md'] },
    },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Statuses: Story = {
    render: () => (
        <div className="flex w-[420px] flex-col gap-2.5">
            <Alert status="success" title="Deployment succeeded" dismissible>
                customer-portal · v2.4.1 is live.
            </Alert>
            <Alert status="info" title="Maintenance window" dismissible>
                On Sunday from 2:00 to 4:00 AM.
            </Alert>
            <Alert status="warn" title="High load" dismissible>
                web-02 has been above 85% for 10 minutes.
            </Alert>
            <Alert status="danger" title="Build failed" dismissible>
                The test step exited with code 1.
            </Alert>
        </div>
    ),
};

/** Neutral status for hints without urgency */
export const Neutral: Story = {
    args: {
        status: 'neutral',
        title: 'Draft',
        dismissible: false,
        children: 'The page is not published yet.',
    },
};

/** Only icon and text in the status color – e.g. below a field or in dense layouts */
export const Simple: Story = {
    render: () => (
        <div className="flex w-[420px] flex-col gap-2.5">
            <Alert variant="simple" status="danger">
                Please enter a valid email address.
            </Alert>
            <Alert variant="simple" status="success" size="sm">
                Saved.
            </Alert>
            <Alert variant="simple" status="neutral" size="sm">
                Last changed 5 minutes ago.
            </Alert>
        </div>
    ),
};

export const Sizes: Story = {
    render: () => (
        <div className="flex w-[420px] flex-col gap-2.5">
            <Alert size="sm" status="info" title="Small" dismissible>
                Compact for tables and sidebars.
            </Alert>
            <Alert status="info" title="Medium" dismissible>
                Default size.
            </Alert>
        </div>
    ),
};

function DurationDemo() {
    const [shown, setShown] = useState(true);
    return (
        <div className="flex w-[420px] flex-col items-start gap-2.5">
            {shown ? (
                <Alert
                    status="success"
                    title="Link copied"
                    duration={8000}
                    dismissible
                    onDismiss={() => setShown(false)}
                >
                    Disappears after 8 seconds, pauses on hover and focus.
                </Alert>
            ) : (
                <button type="button" className="text-sm underline" onClick={() => setShown(true)}>
                    Show again
                </button>
            )}
        </div>
    );
}

/** Dismisses itself after 8 seconds – the time stops while the pointer is over it or the focus is in it */
export const Duration: Story = { render: () => <DurationDemo /> };
