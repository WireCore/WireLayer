import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SaveStatusState } from '@wirecore/wirelayer-recipes';
import { useState } from 'react';
import { Button } from '../Button/Button.js';
import { SaveStatus } from './SaveStatus.js';

const meta = {
    title: 'Feedback/SaveStatus',
    component: SaveStatus,
    args: { status: 'saved' },
    argTypes: { status: { control: 'inline-radio', options: ['idle', 'saving', 'saved', 'error'] } },
} satisfies Meta<typeof SaveStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** All states; the texts can be changed per state (`translations`) */
export const States: Story = {
    render: () => (
        <div className="flex flex-col gap-2">
            <SaveStatus status="saving" />
            <SaveStatus status="saved" />
            <SaveStatus status="error" />
            <SaveStatus status="saved" translations={{ saved: 'Draft saved · 2:32 PM' }} />
        </div>
    ),
};

function AutosaveDemo() {
    const [status, setStatus] = useState<SaveStatusState>('idle');
    const save = (fail: boolean) => {
        setStatus('saving');
        setTimeout(() => setStatus(fail ? 'error' : 'saved'), 1200);
    };
    return (
        <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => save(false)}>
                Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => save(true)}>
                Save (error)
            </Button>
            <SaveStatus status={status} />
        </div>
    );
}

/** Next to a form that saves on its own: the change is announced (role="status") */
export const Autosave: Story = { render: () => <AutosaveDemo /> };
