import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { DataSource } from '@wirecore/wirelayer-recipes/native';
import { ChartColumn, House, LogOut, Moon, Plus, Server, Settings } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { Text } from '../Text/Text.js';
import { CommandPalette, type CommandItem, type CommandPaletteProps } from './CommandPalette.js';

const items: CommandItem[] = [
    { value: 'home', label: 'Overview', group: 'Pages', icon: House },
    { value: 'servers', label: 'Server', group: 'Pages', icon: Server, keywords: ['Hosting', 'Machines'] },
    { value: 'reports', label: 'Reports', group: 'Pages', icon: ChartColumn },
    { value: 'settings', label: 'Settings', group: 'Pages', icon: Settings },
    { value: 'new-server', label: 'Create server', group: 'Actions', icon: Plus, shortcut: 'N' },
    { value: 'dark', label: 'Dark theme', group: 'Actions', icon: Moon },
    { value: 'logout', label: 'Sign out', group: 'Actions', icon: LogOut },
];

function Demo(args: CommandPaletteProps) {
    const [open, setOpen] = useState(false);
    const [chosen, setChosen] = useState('');
    return (
        <View className="items-start gap-3">
            <Button variant="outline" onPress={() => setOpen(true)}>
                Open commands
            </Button>
            <Text aria-live="polite">{chosen ? `Ran: ${chosen}` : ' '}</Text>
            <CommandPalette {...args} open={open} onOpenChange={setOpen} onSelect={setChosen} />
        </View>
    );
}

const meta = {
    title: 'Navigation/CommandPalette',
    component: CommandPalette,
    args: { items },
    argTypes: { items: { control: false } },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Search sheet with groups; typing filters and marks the hits, the number of results is announced (web: Ctrl+K) */
export const Playground: Story = {};

/** Descriptions per item and at most 5 results */
export const Descriptions: Story = {
    name: 'Descriptions',
    args: {
        items: items.map((item) => ({
            ...item,
            description: item.group === 'Pages' ? 'Open page' : 'Run action',
        })),
        limit: 5,
    },
};

const servers = ['web-01', 'web-02', 'web-03', 'db-primary', 'db-replica', 'k8s-node-1', 'k8s-node-2', 'backup-01'];

// Stands in for a server: answers after 600 ms with the matching servers
const serverSource: DataSource<CommandItem> = {
    getItems: ({ search, signal }) =>
        new Promise((resolve, reject) => {
            const timer = setTimeout(
                () =>
                    resolve({
                        items: servers
                            .filter((name) => name.includes((search ?? '').toLowerCase()))
                            .map((name) => ({ value: name, label: name, group: 'Server', icon: Server })),
                    }),
                600
            );
            signal.addEventListener('abort', () => {
                clearTimeout(timer);
                reject(signal.reason);
            });
        }),
};

/** Results from a server after a typing pause, after the matching local items – from 2 characters on */
export const ServerResults: Story = {
    name: 'Data source',
    args: { items: items.filter((item) => item.group === 'Actions'), dataSource: serverSource, minSearchLength: 2 },
};
