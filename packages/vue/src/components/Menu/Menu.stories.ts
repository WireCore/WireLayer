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
} from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Avatar from '../Avatar/Avatar.vue';
import Badge from '../Badge/Badge.vue';
import Button from '../Button/Button.vue';
import IconButton from '../IconButton/IconButton.vue';
import Menu from './Menu.vue';
import type { MenuEntry } from './types.js';

const items = [
    { value: 'edit', label: 'Edit', icon: Pencil, shortcut: '⌘E' },
    { value: 'duplicate', label: 'Duplicate', icon: Copy, shortcut: '⌘D' },
    { value: 'restart', label: 'Restart', icon: RotateCw, shortcut: '⌘R' },
    { value: 'delete', label: 'Delete', icon: Trash2, shortcut: '⌫', danger: true },
];

const meta = {
    title: 'Overlays/Menu',
    component: Menu,
    args: { items, placement: 'bottom-start', arrow: false },
    argTypes: {
        items: { control: false },
        placement: {
            control: 'select',
            options: ['bottom-start', 'bottom', 'bottom-end', 'top-start', 'top', 'top-end', 'left', 'right'],
        },
    },
    render: (args) => ({
        components: { IconButton, Menu },
        setup: () => ({ args, Ellipsis, selected: ref('') }),
        template: `
            <div class="flex flex-col items-center gap-3">
                <Menu v-bind="args" @select="selected = $event">
                    <IconButton :icon="Ellipsis" label="Actions" />
                </Menu>
                <p class="h-4 text-xs text-muted" aria-live="polite">{{ selected && 'Selected: ' + selected }}</p>
            </div>`,
    }),
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

/**
 * Checkbox items (menuitemcheckbox) and a radio group (menuitemradio): they keep the menu open, so several can be
 * switched in a row; Space or Enter switches, the state is announced.
 */
export const CheckboxAndRadio: Story = {
    render: () => ({
        components: { IconButton, Menu },
        setup: () => ({ viewItems, SlidersHorizontal, log: ref('Sort order: name') }),
        template: `
            <div class="flex flex-col items-center gap-3">
                <Menu
                    :items="viewItems"
                    @checked-change="(value, checked) => (log = value + ': ' + (checked ? 'on' : 'off'))"
                    @value-change="(name, value) => (log = 'Sort order: ' + value)"
                >
                    <IconButton :icon="SlidersHorizontal" label="View" />
                </Menu>
                <p class="h-4 text-xs text-muted" aria-live="polite">{{ log }}</p>
            </div>`,
    }),
};

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

/** Filter field for long menus: typing narrows the items, arrow keys move, Enter chooses */
export const Searchable: Story = {
    render: () => ({
        components: { IconButton, Menu },
        setup: () => ({ cities, MapPin, selected: ref('') }),
        template: `
            <div class="flex flex-col items-center gap-3">
                <Menu :items="cities" searchable @select="selected = $event">
                    <IconButton :icon="MapPin" label="Choose location" />
                </Menu>
                <p class="h-4 text-xs text-muted" aria-live="polite">{{ selected && 'Selected: ' + selected }}</p>
            </div>`,
    }),
};

/**
 * Items with `href` or `to` are links. With vue-router: `:link-as="RouterLink"` and items with `to` (a path or a route
 * object); NuxtLink takes either. The `item` slot shows own content, here a badge.
 */
export const LinksAndOwnContent: Story = {
    render: () => ({
        components: { Badge, IconButton, Menu },
        setup: () => ({
            Ellipsis,
            links: [
                { value: 'docs', label: 'Documentation', href: '#docs' },
                { value: 'status', label: 'Status page', href: '#status' },
                { value: 'support', label: 'Support', href: '#support' },
            ],
        }),
        template: `
            <Menu :items="links">
                <IconButton :icon="Ellipsis" label="Help" />
                <template #item="{ item }">
                    <span class="flex-1">{{ item.label }}</span>
                    <Badge v-if="item.value === 'status'" variant="success">ok</Badge>
                </template>
            </Menu>`,
    }),
};

/**
 * Opened from code at any element or pointer position – without a trigger: `menu.open(event)` (template ref).
 * Here a click on a table row opens the menu at the pointer, the button at itself.
 */
export const OpenAtAnchor: Story = {
    render: () => ({
        components: { Button, Menu },
        setup: () => {
            const menu = ref<InstanceType<typeof Menu> | null>(null);
            return { menu, items, selected: ref('') };
        },
        template: `
            <div class="flex flex-col items-center gap-3">
                <Button variant="outline" @click="menu?.open($event.currentTarget)">Actions for web-01</Button>
                <button
                    type="button"
                    class="w-72 rounded-lg border border-line p-4 text-sm text-fg"
                    @click="menu?.open($event)"
                >
                    Row web-01 – click opens at the pointer
                </button>
                <Menu ref="menu" :items="items" @select="selected = $event" />
                <p class="h-4 text-xs text-muted" aria-live="polite">{{ selected && 'Selected: ' + selected }}</p>
            </div>`,
    }),
};

/**
 * User menu at the right edge of a header: the Avatar as the trigger (`as="button"`, named by `name`), opening
 * towards the start (`placement="bottom-end"`) with an arrow at the avatar.
 */
export const UserMenu: Story = {
    render: () => ({
        components: { Avatar, Menu },
        setup: () => ({
            account: [
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
            ] satisfies MenuEntry[],
        }),
        template: `
            <div class="flex w-full max-w-xl items-center justify-between rounded-lg border border-line px-4 py-2">
                <span class="text-sm font-semibold">Console</span>
                <Menu :items="account" placement="bottom-end" arrow>
                    <Avatar as="button" name="Julia Klein" color="auto" size="sm" />
                </Menu>
            </div>`,
    }),
};

/**
 * A menu at a point stays where it opened: `close-on-scroll`, `close-on-resize` and `close-on-blur` close it when the
 * content below scrolls, the window is resized or loses the focus. `highlight-first` highlights the first item also
 * when it opens by pointer, so Enter takes it
 */
export const ClosesWithThePage: Story = {
    name: 'Closes with the page',
    render: () => ({
        components: { Menu },
        setup: () => ({ menu: ref<InstanceType<typeof Menu> | null>(null), items, selected: ref('') }),
        template: `
            <div class="flex flex-col items-center gap-3">
                <button type="button" class="w-72 rounded-lg border border-line p-4 text-sm text-fg" @click="menu?.open($event)">
                    Row web-01 – click opens at the pointer
                </button>
                <Menu
                    ref="menu"
                    :items="items"
                    close-on-scroll
                    close-on-resize
                    close-on-blur
                    highlight-first
                    @select="selected = $event"
                />
                <p class="h-4 text-xs text-muted" aria-live="polite">{{ selected && 'Selected: ' + selected }}</p>
            </div>`,
    }),
};
