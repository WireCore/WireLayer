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

const hosts = ['web-01', 'web-02', 'db-01'];
const hostItems: MenuEntry[] = [
    { value: 'connect', label: 'Connect' },
    { value: 'rename', label: 'Rename', shortcut: 'F2' },
    { type: 'separator' },
    { value: 'delete', label: 'Delete', shortcut: 'Del', danger: true },
];

function DesktopListDemo() {
    const [current, setCurrent] = useState('web-01');
    const [open, setOpen] = useState(false);
    return (
        <div className="flex w-72 flex-col gap-3">
            <ContextMenu
                items={hostItems}
                label="Host actions"
                open={open}
                onOpenChange={setOpen}
                highlightFirst
                closeOnScroll
                closeOnResize
                closeOnBlur
                onBeforeOpen={(target) => {
                    const row = target.closest<HTMLElement>('[data-host]');
                    if (row) setCurrent(row.dataset.host!);
                }}
            >
                <ul className="m-0 flex list-none flex-col rounded-lg border border-line p-1" aria-label="Hosts">
                    {hosts.map((host) => (
                        <li
                            key={host}
                            data-host={host}
                            className={`rounded-md px-2.5 py-1.5 text-sm text-fg ${host === current ? 'bg-line font-medium' : ''}`}
                            aria-current={host === current || undefined}
                            onClick={() => setCurrent(host)}
                        >
                            {host}
                        </li>
                    ))}
                </ul>
            </ContextMenu>
            <span className="text-xs text-muted">
                Selected: {current} · Menu open: {String(open)}
            </span>
        </div>
    );
}

/**
 * A list as in a desktop app: `onBeforeOpen` gets the right-clicked element – select its row before the menu shows;
 * `open`/`onOpenChange` tell whether the menu is open (e.g. to pause Delete or F2 on the list). `highlightFirst` and
 * the close props as on Menu
 */
export const DesktopList: Story = { name: 'Desktop list', render: () => <DesktopListDemo /> };
