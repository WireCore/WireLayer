import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { useHotkeys } from '../../hooks/hotkeys.js';
import { Input } from '../Input/Input.js';
import { Kbd } from '../Kbd/Kbd.js';
import { HotkeysDialog } from './HotkeysDialog.js';

// A page with shortcuts: registered with useHotkeys, shown with Kbd, listed in the HotkeysDialog
function Page() {
    const [log, setLog] = useState('–');
    useHotkeys([
        ['mod+s', () => setLog('Saved'), { description: 'Save', group: 'Document' }],
        ['mod+shift+n', () => setLog('New document'), { description: 'New document', group: 'Document' }],
        ['g i', () => setLog('Go to inbox'), { description: 'Go to inbox', group: 'Navigation' }],
        ['g d', () => setLog('Go to dashboard'), { description: 'Go to dashboard', group: 'Navigation' }],
    ]);
    return (
        <div className="flex w-96 flex-col gap-3 text-sm">
            <p>
                <Kbd hotkey="?" /> shows all shortcuts, <Kbd hotkey="mod+s" /> saves, <Kbd hotkey="g i" /> opens the
                inbox.
            </p>
            <Input aria-label="Note" placeholder="Type here: single keys are not shortcuts here" />
            <p className="text-muted" aria-live="polite">
                Last: {log}
            </p>
            <HotkeysDialog />
        </div>
    );
}

const meta = {
    title: 'Utilities/HotkeysDialog',
    component: HotkeysDialog,
    render: () => <Page />,
} satisfies Meta<typeof HotkeysDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** "?" opens the overview of the registered shortcuts (grouped, keys per platform: ⌘ or Ctrl) */
export const Playground: Story = {};
