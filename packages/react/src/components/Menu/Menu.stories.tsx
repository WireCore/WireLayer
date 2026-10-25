import type { Meta, StoryObj } from '@storybook/react-vite';
import type { OverlayHandle } from '@wirecore/wirelayer-recipes';
import {
    Copy,
    Ellipsis,
    FolderInput,
    LogOut,
    MapPin,
    Pencil,
    RotateCw,
    Settings,
    SlidersHorizontal,
    Trash2,
    UserRound,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Avatar } from '../Avatar/Avatar.js';
import { Badge } from '../Badge/Badge.js';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { Menu, type MenuEntry, type MenuProps } from './Menu.js';

const items = [
    { value: 'edit', label: 'Edit', icon: Pencil, shortcut: '⌘E' },
    { value: 'duplicate', label: 'Duplicate', icon: Copy, shortcut: '⌘D' },
    { value: 'restart', label: 'Restart', icon: RotateCw, shortcut: '⌘R' },
    { value: 'delete', label: 'Delete', icon: Trash2, shortcut: '⌫', danger: true },
];

function MenuDemo(props: Omit<MenuProps, 'children'>) {
    const [selected, setSelected] = useState('');
    return (
        <div className="flex flex-col items-center gap-3">
            <Menu {...props} onSelect={setSelected}>
                <IconButton icon={Ellipsis} label="Actions" />
            </Menu>
            <p className="h-4 text-xs text-muted" aria-live="polite">
                {selected && `Selected: ${selected}`}
            </p>
        </div>
    );
}

const meta = {
    title: 'Overlays/Menu',
    component: Menu,
    args: { items, placement: 'bottom-start', arrow: false, children: <span /> },
    argTypes: {
        items: { control: false },
        placement: {
            control: 'select',
            options: ['bottom-start', 'bottom', 'bottom-end', 'top-start', 'top', 'top-end', 'left', 'right'],
        },
        children: { control: false },
    },
    render: (args) => <MenuDemo items={args.items} placement={args.placement} arrow={args.arrow} />,
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const grouped: MenuEntry[] = [
    {
        type: 'group',
        label: 'Server',
        items: [
            { value: 'edit', label: 'Edit', icon: Pencil, shortcut: '⌘E' },
            {
                value: 'move',
                label: 'Move to',
                icon: FolderInput,
                children: [
                    { value: 'move-fra', label: 'Frankfurt' },
                    { value: 'move-nue', label: 'Nuremberg' },
                    { value: 'move-vie', label: 'Vienna', disabled: true },
                ],
            },
        ],
    },
    { type: 'separator' },
    { value: 'delete', label: 'Delete', icon: Trash2, danger: true },
];

/** Groups with a heading, a separator and a submenu (arrow right opens it) */
export const GroupsAndSubmenus: Story = { args: { items: grouped } };

const viewItems: MenuEntry[] = [
    { type: 'checkbox', value: 'grid', label: 'Show grid', checked: true },
    { type: 'checkbox', value: 'offline', label: 'Show offline servers' },
    { type: 'separator' },
    {
        type: 'radio',
        name: 'sort',
        label: 'Sort order',
        value: 'name',
        items: [
            { value: 'name', label: 'Name' },
            { value: 'load', label: 'Load' },
            { value: 'location', label: 'Location' },
        ],
    },
];

function CheckboxAndRadioDemo() {
    const [log, setLog] = useState('Sort order: name');
    return (
        <div className="flex flex-col items-center gap-3">
            <Menu
                items={viewItems}
                onCheckedChange={(value, checked) => setLog(`${value}: ${checked ? 'on' : 'off'}`)}
                onValueChange={(_name, value) => setLog(`Sort order: ${value}`)}
            >
                <IconButton icon={SlidersHorizontal} label="View" />
            </Menu>
            <p className="h-4 text-xs text-muted" aria-live="polite">
                {log}
            </p>
        </div>
    );
}

/**
 * Checkbox items (menuitemcheckbox) and a radio group (menuitemradio): they keep the menu open, so several can be
 * switched in a row; Space or Enter switches, the state is announced.
 */
export const CheckboxAndRadio: Story = { render: () => <CheckboxAndRadioDemo /> };

const cities = [
    'Berlin',
    'Bremen',
    'Cologne',
    'Dortmund',
    'Dresden',
    'Düsseldorf',
    'Essen',
    'Frankfurt',
    'Hamburg',
    'Hanover',
    'Leipzig',
    'Munich',
    'Nuremberg',
    'Stuttgart',
    'Vienna',
    'Zurich',
].map((city) => ({ value: city.toLowerCase(), label: city }));

function SearchableDemo() {
    const [selected, setSelected] = useState('');
    return (
        <div className="flex flex-col items-center gap-3">
            <Menu items={cities} searchable onSelect={setSelected}>
                <IconButton icon={MapPin} label="Choose location" />
            </Menu>
            <p className="h-4 text-xs text-muted" aria-live="polite">
                {selected && `Selected: ${selected}`}
            </p>
        </div>
    );
}

/** Filter field for long menus: typing narrows the items, arrow keys move, Enter chooses */
export const Searchable: Story = { render: () => <SearchableDemo /> };

/**
 * Items with `href` or `to` are links: `linkAs={Link}` with `href` for Next.js, with `to` for React Router or TanStack
 * Router. `renderItem` shows own content, here a badge.
 */
export const LinksAndOwnContent: Story = {
    render: () => (
        <Menu
            items={[
                { value: 'docs', label: 'Documentation', href: '#docs' },
                { value: 'status', label: 'Status page', href: '#status' },
                { value: 'support', label: 'Support', href: '#support' },
            ]}
            renderItem={(item) => (
                <>
                    <span className="flex-1">{item.label}</span>
                    {item.value === 'status' && <Badge variant="success">ok</Badge>}
                </>
            )}
        >
            <IconButton icon={Ellipsis} label="Help" />
        </Menu>
    ),
};

function OpenAtAnchorDemo() {
    const menu = useRef<OverlayHandle>(null);
    const [selected, setSelected] = useState('');
    return (
        <div className="flex flex-col items-center gap-3">
            <Button variant="outline" onClick={(event) => menu.current?.open(event.currentTarget)}>
                Actions for web-01
            </Button>
            <button
                type="button"
                className="w-72 rounded-lg border border-line p-4 text-sm text-fg"
                onClick={(event) => menu.current?.open(event.nativeEvent)}
            >
                Row web-01 – click opens at the pointer
            </button>
            <Menu ref={menu} items={items} onSelect={setSelected} />
            <p className="h-4 text-xs text-muted" aria-live="polite">
                {selected && `Selected: ${selected}`}
            </p>
        </div>
    );
}

/**
 * Opened from code at any element or pointer position – without a trigger: `menu.open(event)` (ref).
 * Here a click on a table row opens the menu at the pointer, the button at itself.
 */
export const OpenAtAnchor: Story = { render: () => <OpenAtAnchorDemo /> };

const account: MenuEntry[] = [
    {
        type: 'group',
        label: 'julia@example.com',
        items: [
            { value: 'profile', label: 'Profile', icon: UserRound },
            { value: 'settings', label: 'Settings', icon: Settings },
        ],
    },
    { type: 'separator' },
    { value: 'logout', label: 'Sign out', icon: LogOut },
];

/**
 * User menu at the right edge of a header: the Avatar as the trigger (`as="button"`, named by `name`), opening
 * towards the start (`placement="bottom-end"`) with an arrow at the avatar.
 */
export const UserMenu: Story = {
    render: () => (
        <div className="flex w-full max-w-xl items-center justify-between rounded-lg border border-line px-4 py-2">
            <span className="text-sm font-semibold">Console</span>
            <Menu items={account} placement="bottom-end" arrow>
                <Avatar as="button" name="Julia Klein" color="auto" size="sm" />
            </Menu>
        </div>
    ),
};
