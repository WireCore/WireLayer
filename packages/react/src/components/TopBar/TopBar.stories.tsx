import type { Meta, StoryObj } from '@storybook/react-vite';
import { LayoutGrid, LogOut, Settings } from 'lucide-react';
import { Avatar } from '../Avatar/Avatar.js';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { Menu, type MenuEntry } from '../Menu/Menu.js';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '../Popover/Popover.js';
import { SearchField } from '../SearchField/SearchField.js';
import { TopBar } from './TopBar.js';

const meta = {
    title: 'Layout/TopBar',
    component: TopBar,
} satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const apps = ['Mail', 'Calendar', 'Files', 'Chat', 'Billing', 'Admin'];
const account: MenuEntry[] = [
    { value: 'settings', label: 'Settings', icon: Settings },
    { type: 'separator' },
    { value: 'logout', label: 'Sign out', icon: LogOut },
];

/**
 * Header of an app outside AppShell: name at the start, search in the middle, app switcher (Popover) and user menu
 * (Avatar as the Menu trigger) at the end. The bar adds no keyboard handling of its own.
 */
export const Playground: Story = {
    render: () => (
        <TopBar
            start={<span className="text-sm font-semibold">Console</span>}
            end={
                <>
                    <Popover placement="bottom-end">
                        <PopoverTrigger>
                            <IconButton icon={LayoutGrid} label="Apps" variant="text" />
                        </PopoverTrigger>
                        <PopoverContent title="Apps" hideTitle closable={false} className="w-64">
                            <div className="grid grid-cols-3 gap-1">
                                {apps.map((app) => (
                                    <PopoverClose key={app}>
                                        <Button size="sm" variant="text">
                                            {app}
                                        </Button>
                                    </PopoverClose>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Menu items={account} placement="bottom-end" arrow>
                        <Avatar as="button" name="Julia Klein" color="auto" size="sm" />
                    </Menu>
                </>
            }
        >
            <SearchField label="Search" className="max-w-sm" />
        </TopBar>
    ),
};
