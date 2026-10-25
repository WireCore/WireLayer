import { LayoutGrid, LogOut, Settings } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Avatar from '../Avatar/Avatar.vue';
import Button from '../Button/Button.vue';
import IconButton from '../IconButton/IconButton.vue';
import Menu from '../Menu/Menu.vue';
import Popover from '../Popover/Popover.vue';
import PopoverClose from '../Popover/PopoverClose.vue';
import PopoverContent from '../Popover/PopoverContent.vue';
import PopoverTrigger from '../Popover/PopoverTrigger.vue';
import SearchField from '../SearchField/SearchField.vue';
import TopBar from './TopBar.vue';

const meta = {
    title: 'Layout/TopBar',
    component: TopBar,
} satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Header of an app outside AppShell: name at the start, search in the middle, app switcher (Popover) and user menu
 * (Avatar as the Menu trigger) at the end. The bar adds no keyboard handling of its own.
 */
export const Playground: Story = {
    render: () => ({
        components: {
            Avatar,
            Button,
            IconButton,
            Menu,
            Popover,
            PopoverClose,
            PopoverContent,
            PopoverTrigger,
            SearchField,
            TopBar,
        },
        setup: () => ({
            LayoutGrid,
            apps: ['Mail', 'Calendar', 'Files', 'Chat', 'Billing', 'Admin'],
            account: [
                { value: 'settings', label: 'Settings', icon: Settings },
                { type: 'separator' },
                { value: 'logout', label: 'Sign out', icon: LogOut },
            ],
        }),
        template: `
            <TopBar>
                <template #start><span class="text-sm font-semibold">Console</span></template>
                <SearchField label="Search" class="max-w-sm" />
                <template #end>
                    <Popover placement="bottom-end">
                        <PopoverTrigger><IconButton :icon="LayoutGrid" label="Apps" variant="text" /></PopoverTrigger>
                        <PopoverContent title="Apps" hide-title :closable="false" class="w-64">
                            <div class="grid grid-cols-3 gap-1">
                                <PopoverClose v-for="app in apps" :key="app">
                                    <Button size="sm" variant="text">{{ app }}</Button>
                                </PopoverClose>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Menu :items="account" placement="bottom-end" arrow>
                        <Avatar as="button" name="Julia Klein" color="auto" size="sm" />
                    </Menu>
                </template>
            </TopBar>`,
    }),
};

/**
 * Triggers side by side: the app switcher (IconButton, outline) and the user menu (Avatar as a button, outline) – both
 * 40 px with the same hover, so they read as one set
 */
export const AppSwitcherAndUserMenu: Story = {
    render: () => ({
        components: { Avatar, IconButton, Menu, TopBar },
        setup: () => ({
            LayoutGrid,
            appMenu: [
                { value: 'mail', label: 'Mail' },
                { value: 'files', label: 'Files' },
            ],
            account: [
                { value: 'settings', label: 'Settings', icon: Settings },
                { value: 'logout', label: 'Sign out', icon: LogOut },
            ],
        }),
        template: `
            <TopBar>
                <template #start><span class="text-sm font-semibold">Console</span></template>
                <template #end>
                    <Menu :items="appMenu" placement="bottom-end"><IconButton :icon="LayoutGrid" label="Apps" /></Menu>
                    <Menu :items="account" placement="bottom-end" arrow>
                        <Avatar as="button" variant="outline" name="Julia Klein" />
                    </Menu>
                </template>
            </TopBar>`,
    }),
};
