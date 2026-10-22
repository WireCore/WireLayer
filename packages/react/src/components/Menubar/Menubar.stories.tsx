import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilePlus, FolderOpen, Redo2, Save, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '../Avatar/Avatar.js';
import { Menubar, type MenubarMenu } from './Menubar.js';

const menus: MenubarMenu[] = [
    {
        label: 'File',
        items: [
            { value: 'new', label: 'New', icon: FilePlus, shortcut: '⌘N' },
            { value: 'open', label: 'Open …', icon: FolderOpen, shortcut: '⌘O' },
            {
                value: 'recent',
                label: 'Open recent',
                children: [
                    { value: 'recent-1', label: 'Quote.pdf' },
                    { value: 'recent-2', label: 'Contract.pdf' },
                ],
            },
            { type: 'separator' },
            { value: 'save', label: 'Save', icon: Save, shortcut: '⌘S' },
        ],
    },
    {
        label: 'Edit',
        items: [
            { value: 'undo', label: 'Undo', icon: Undo2, shortcut: '⌘Z' },
            { value: 'redo', label: 'Redo', icon: Redo2, shortcut: '⇧⌘Z' },
        ],
    },
    {
        label: 'View',
        items: [
            { value: 'zoom-in', label: 'Zoom in' },
            { value: 'zoom-out', label: 'Zoom out' },
        ],
    },
];

function Demo({ menus }: { menus: MenubarMenu[] }) {
    const [selected, setSelected] = useState('');
    return (
        <div className="flex flex-col gap-3">
            <Menubar menus={menus} aria-label="Application" onSelect={setSelected} />
            <p className="h-4 text-xs text-muted" aria-live="polite">
                {selected && `Selected: ${selected}`}
            </p>
        </div>
    );
}

const meta = {
    title: 'Navigation/Menubar',
    component: Menubar,
    args: { menus },
    argTypes: { menus: { control: false } },
    render: (args) => <Demo menus={args.menus} />,
} satisfies Meta<typeof Menubar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const viewMenus: MenubarMenu[] = [
    ...menus.slice(0, 2),
    {
        label: 'View',
        items: [
            { type: 'checkbox', value: 'sidebar', label: 'Sidebar', checked: true },
            { type: 'checkbox', value: 'minimap', label: 'Minimap' },
            { type: 'separator' },
            {
                type: 'radio',
                name: 'zoom',
                label: 'Zoom',
                value: '100',
                items: [
                    { value: '75', label: '75 %' },
                    { value: '100', label: '100 %' },
                    { value: '125', label: '125 %' },
                ],
            },
        ],
    },
];

function StartEndDemo() {
    const [selected, setSelected] = useState('');
    return (
        <div className="flex flex-col gap-3">
            <Menubar
                menus={viewMenus}
                aria-label="Application"
                responsive
                onSelect={setSelected}
                start={<strong className="text-sm">WireLayer</strong>}
                end={<Avatar name="Julia Klein" size="sm" />}
            />
            <p className="h-4 text-xs text-muted" aria-live="polite">
                {selected && `Selected: ${selected}`}
            </p>
        </div>
    );
}

/**
 * Content before and after the bar (`start`/`end` slots), checkbox and radio items; with `responsive` a menu button
 * replaces the bar below the md breakpoint (narrow the window to see it).
 */
export const StartEndResponsive: Story = { render: () => <StartEndDemo /> };
