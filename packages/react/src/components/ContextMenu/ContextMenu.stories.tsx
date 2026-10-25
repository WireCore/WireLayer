import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClipboardPaste, Copy, Scissors } from 'lucide-react';
import { useState } from 'react';
import type { MenuEntry } from '../Menu/Menu.js';
import { ContextMenu } from './ContextMenu.js';

const items: MenuEntry[] = [
    { value: 'cut', label: 'Cut', icon: Scissors, shortcut: '⌘X' },
    { value: 'copy', label: 'Copy', icon: Copy, shortcut: '⌘C' },
    { value: 'paste', label: 'Paste', icon: ClipboardPaste, shortcut: '⌘V' },
    { type: 'separator' },
    { value: 'select-all', label: 'Select all' },
];

function Demo({ items }: { items: readonly MenuEntry[] }) {
    const [selected, setSelected] = useState('');
    return (
        <div className="flex flex-col items-center gap-3">
            <ContextMenu items={items} onSelect={setSelected}>
                <div
                    tabIndex={0}
                    className="flex h-40 w-72 items-center justify-center rounded-xl border border-dashed border-line-strong text-sm text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                >
                    Right-click or Shift+F10
                </div>
            </ContextMenu>
            <p className="h-4 text-xs text-muted" aria-live="polite">
                {selected && `Selected: ${selected}`}
            </p>
        </div>
    );
}

const meta = {
    title: 'Overlays/ContextMenu',
    component: ContextMenu,
    args: { items, children: <span /> },
    argTypes: { items: { control: false }, children: { control: false } },
    render: (args) => <Demo items={args.items} />,
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * The same item kinds as Menu: checkbox items, a radio group, links. On touch screens a long press (half a second)
 * opens the menu at the finger.
 */
export const ItemTypes: Story = {
    args: {
        items: [
            { type: 'checkbox', value: 'wrap', label: 'Wrap lines', checked: true },
            { type: 'checkbox', value: 'numbers', label: 'Line numbers' },
            { type: 'separator' },
            {
                type: 'radio',
                name: 'size',
                label: 'Font size',
                value: 'm',
                items: [
                    { value: 's', label: 'Small' },
                    { value: 'm', label: 'Medium' },
                    { value: 'l', label: 'Large' },
                ],
            },
        ],
    },
};
