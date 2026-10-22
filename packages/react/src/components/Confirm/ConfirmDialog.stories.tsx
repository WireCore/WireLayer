import type { Meta, StoryObj } from '@storybook/react-vite';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../Button/Button.js';
import { confirm, prompt } from './confirm.js';
import { ConfirmDialog } from './ConfirmDialog.js';

function ConfirmDemo() {
    const [result, setResult] = useState('');
    const remove = async () => {
        const confirmed = await confirm({
            title: 'Delete server?',
            description: 'web-01 and all snapshots will be permanently removed.',
            confirmLabel: 'Delete',
            status: 'danger',
            icon: Trash2,
        });
        setResult(confirmed ? 'Deleted' : 'Canceled');
    };

    return (
        <div className="flex items-center gap-3">
            <Button variant="danger" leadingIcon={Trash2} onClick={remove}>
                Delete server
            </Button>
            <span className="text-sm text-muted" aria-live="polite">
                {result}
            </span>
            <ConfirmDialog />
        </div>
    );
}

const meta = {
    title: 'Overlays/Confirm',
    component: ConfirmDemo,
} satisfies Meta<typeof ConfirmDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function PromptDemo() {
    const [result, setResult] = useState('');
    const rename = async () => {
        const name = await prompt({
            title: 'Rename server',
            label: 'New name',
            defaultValue: 'web-01',
            validate: (value) => (/^[a-z0-9-]{3,}$/.test(value) ? undefined : 'At least 3 characters: a–z, 0–9, -'),
        });
        setResult(name === null ? 'Canceled' : `New name: ${name}`);
    };
    const remove = async () => {
        const confirmed = await confirm({
            title: 'Permanently delete web-01?',
            description: 'All data and snapshots will be lost.',
            confirmLabel: 'Delete',
            status: 'danger',
            icon: Trash2,
            typeToConfirm: 'web-01',
        });
        setResult(confirmed ? 'Deleted' : 'Canceled');
    };
    return (
        <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={rename}>
                Rename …
            </Button>
            <Button variant="danger" onClick={remove}>
                Delete permanently …
            </Button>
            <span className="text-sm text-muted" aria-live="polite">
                {result}
            </span>
            <ConfirmDialog />
        </div>
    );
}

/**
 * `prompt()` asks for a text (with validation, Enter confirms) and resolves with it or null; `typeToConfirm` lets
 * a deletion only go through after typing the name.
 */
export const PromptAndTypeToConfirm: Story = { render: () => <PromptDemo /> };
