import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button/Button.js';
import { Result } from './Result.js';

const meta = {
    title: 'Feedback/Result',
    component: Result,
    args: { status: '404' },
    argTypes: {
        status: { control: 'select', options: ['success', 'info', 'warn', 'error', '403', '404', '500'] },
    },
    render: (args) => (
        <Result
            {...args}
            actions={
                <>
                    <Button variant="outline">Back</Button>
                    <Button>Go to home page</Button>
                </>
            }
        />
    ),
} satisfies Meta<typeof Result>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Error page with code, default title and text */
export const Playground: Story = {};

/** After a form: own title and text, extra content */
export const Success: Story = {
    render: () => (
        <Result
            status="success"
            title="Order placed"
            description="You will receive a confirmation email in a few minutes."
            actions={<Button>Go to overview</Button>}
        >
            <p className="rounded-lg bg-bg-2 px-4 py-2 font-mono text-sm">Order number 2026-4711</p>
        </Result>
    ),
};

/** All states */
export const Statuses: Story = {
    render: () => (
        <div className="grid gap-4 sm:grid-cols-2">
            {(['success', 'info', 'warn', 'error', '403', '404', '500'] as const).map((status) => (
                <Result key={status} status={status} headingLevel={3} className="rounded-xl border border-line" />
            ))}
        </div>
    ),
};
