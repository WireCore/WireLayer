import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../Button/Button.js';
import { SessionTimeout, type SessionTimeoutProps } from './SessionTimeout.js';

function Demo(args: Omit<SessionTimeoutProps, 'expiresAt'>) {
    const [expiresAt, setExpiresAt] = useState(() => Date.now() + 70_000);
    const [log, setLog] = useState('Session active');
    return (
        <div className="flex flex-col items-start gap-3">
            <Button size="sm" variant="outline" onClick={() => setExpiresAt(Date.now() + 65_000)}>
                Session ends in 65 seconds
            </Button>
            <span className="text-sm text-muted">{log}</span>
            <SessionTimeout
                {...args}
                expiresAt={expiresAt}
                onExtend={() => {
                    setExpiresAt(Date.now() + 15 * 60_000);
                    setLog('Extended by 15 minutes');
                }}
                onSignOut={() => setLog('Signed out')}
                onExpire={() => setLog('Session expired')}
            />
        </div>
    );
}

const meta = {
    title: 'Feedback/SessionTimeout',
    component: SessionTimeout,
    args: { warnBefore: 60 },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof SessionTimeout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The warning opens a minute before the end (WCAG 2.2.1: at least 20 seconds and one action to extend) */
export const Playground: Story = { args: { expiresAt: 0 } };
