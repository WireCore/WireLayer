import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type FormEvent } from 'react';
import { Button } from '../Button/Button.js';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { DialogHost } from './DialogHost.js';
import { openDialog } from './dialogs.js';

// Example content for the dialog service story
function RenameForm({ current, close }: { current: string; close: (result?: string) => void }) {
    const [name, setName] = useState(current);
    return (
        <form
            className="mt-2 flex flex-col gap-4"
            onSubmit={(event: FormEvent) => {
                event.preventDefault();
                close(name);
            }}
        >
            <Field label="New name">
                <Input value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => close()}>
                    Cancel
                </Button>
                <Button size="sm" type="submit">
                    Rename
                </Button>
            </div>
        </form>
    );
}

function Demo() {
    const [name, setName] = useState('web-01');
    const rename = async () => {
        const result = await openDialog<string>({
            title: 'Rename server',
            description: 'The name appears in all overviews.',
            content: (close) => <RenameForm current={name} close={close} />,
        });
        if (result) setName(result);
    };
    return (
        <div className="flex flex-col items-center gap-3">
            <Button onClick={rename}>Rename …</Button>
            <p className="text-xs text-muted" aria-live="polite">
                Name: {name}
            </p>
            <DialogHost />
        </div>
    );
}

const meta = {
    title: 'Overlays/DialogService',
    component: DialogHost,
    render: () => <Demo />,
} satisfies Meta<typeof DialogHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function DataDemo() {
    const [result, setResult] = useState('');
    const open = async () => {
        const dialog = openDialog<string>({
            title: 'web-01',
            description: 'Loading …',
            data: { name: 'web-01', location: 'Frankfurt' },
            size: 'lg',
            position: 'top',
            // Shows the data passed with openDialog({ data }) and closes with a result
            content: (close, data) => {
                const server = data as { name: string; location: string };
                return (
                    <div className="mt-2 flex flex-col gap-3 text-sm">
                        <p>
                            {server.name} is located in {server.location}.
                        </p>
                        <Button size="sm" className="self-end" onClick={() => close('ok')}>
                            Done
                        </Button>
                    </div>
                );
            },
        });
        setTimeout(() => dialog.update({ description: 'Ubuntu 26.04 · 8 vCPU · 32 GB' }), 1000);
        setResult((await dialog) ?? 'Closed');
    };
    return (
        <div className="flex flex-col items-center gap-3">
            <Button onClick={open}>Show details</Button>
            <p className="text-xs text-muted" aria-live="polite">
                {result}
            </p>
            <DialogHost />
        </div>
    );
}

/**
 * Data for the dialog (`data`), size and position; the returned handle changes the open dialog (`update`) and
 * `closeAllDialogs()` closes every dialog of the host.
 */
export const DataSizeAndUpdate: Story = { render: () => <DataDemo /> };
