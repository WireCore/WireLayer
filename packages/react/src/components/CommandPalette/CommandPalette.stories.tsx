import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartColumn, House, LogOut, Moon, Plus, Server, Settings } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../Button/Button.js';
import { Kbd } from '../Kbd/Kbd.js';
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
        <div className="flex flex-col items-center gap-3">
            <Button variant="outline" onClick={() => setOpen(true)}>
                Open commands <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>
            </Button>
            <p className="h-4 text-xs text-muted" aria-live="polite">
                {chosen && `Ran: ${chosen}`}
            </p>
            <CommandPalette {...args} open={open} onOpenChange={setOpen} onSelect={setChosen} />
        </div>
    );
}

const meta = {
    title: 'Navigation/CommandPalette',
    component: CommandPalette,
    args: { items, hotkey: true },
    argTypes: { items: { control: false } },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * Descriptions per item, matches marked in the label, at most 5 results and own shortcuts: Ctrl+K / ⌘K and "/"
 * (not while typing in a field)
 */
export const DescriptionsAndShortcuts: Story = {
    args: {
        items: items.map((item) => ({
            ...item,
            description: item.group === 'Pages' ? 'Open page' : 'Run action',
        })),
        hotkey: ['mod+k', '/'],
        limit: 5,
    },
};

const servers = ['web-01', 'web-02', 'web-03', 'db-primary', 'db-replica', 'k8s-node-1', 'k8s-node-2', 'backup-01'];

function ServerResultsDemo() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<CommandItem[]>([]);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const search = (query: string) => {
        clearTimeout(timer.current);
        setLoading(true);
        timer.current = setTimeout(() => {
            setResults(
                servers
                    .filter((name) => name.includes(query.toLowerCase()))
                    .map((name) => ({ value: name, label: name, group: 'Server', icon: Server }))
            );
            setLoading(false);
        }, 600);
    };
    return (
        <div className="flex flex-col items-center gap-3">
            <Button
                variant="outline"
                onClick={() => {
                    setOpen(true);
                    search('');
                }}
            >
                Search servers
            </Button>
            <CommandPalette
                open={open}
                onOpenChange={setOpen}
                items={results}
                filter={false}
                loading={loading}
                hotkey={false}
                placeholder="Enter server name …"
                emptyText="No server found"
                onSearch={search}
            />
        </div>
    );
}

/**
 * Results from the server: `onSearch` reports the text, `loading` shows the loading row, `filter={false}` shows the
 * results as they come. Here simulated with a delay.
 */
export const ServerResults: Story = { render: () => <ServerResultsDemo /> };
