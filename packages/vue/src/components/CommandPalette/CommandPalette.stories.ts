import { ChartColumn, House, LogOut, Moon, Plus, Server, Settings } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from '../Button/Button.vue';
import Kbd from '../Kbd/Kbd.vue';
import CommandPalette, { type CommandItem } from './CommandPalette.vue';

const items: CommandItem[] = [
    { value: 'home', label: 'Overview', group: 'Pages', icon: House },
    { value: 'servers', label: 'Server', group: 'Pages', icon: Server, keywords: ['Hosting', 'Machines'] },
    { value: 'reports', label: 'Reports', group: 'Pages', icon: ChartColumn },
    { value: 'settings', label: 'Settings', group: 'Pages', icon: Settings },
    { value: 'new-server', label: 'Create server', group: 'Actions', icon: Plus, shortcut: 'N' },
    { value: 'dark', label: 'Dark theme', group: 'Actions', icon: Moon },
    { value: 'logout', label: 'Sign out', group: 'Actions', icon: LogOut },
];

const meta = {
    title: 'Navigation/CommandPalette',
    component: CommandPalette,
    args: { items, hotkey: true },
    argTypes: { items: { control: false } },
    render: (args) => ({
        components: { Button, CommandPalette, Kbd },
        setup: () => ({ args, open: ref(false), chosen: ref('') }),
        template: `
            <div class="flex flex-col items-center gap-3">
                <Button variant="outline" @click="open = true">Open commands <Kbd>Ctrl</Kbd> <Kbd>K</Kbd></Button>
                <p class="h-4 text-xs text-muted" aria-live="polite">{{ chosen && 'Ran: ' + chosen }}</p>
                <CommandPalette v-bind="args" v-model:open="open" @select="chosen = $event" />
            </div>`,
    }),
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

/**
 * Results from the server: `search` reports the text, `loading` shows the loading row, `:filter="false"` shows the
 * results as they come. Here simulated with a delay.
 */
export const ServerResults: Story = {
    render: () => ({
        components: { Button, CommandPalette },
        setup: () => {
            const open = ref(false);
            const loading = ref(false);
            const results = ref<CommandItem[]>([]);
            let timer: ReturnType<typeof setTimeout> | undefined;
            const search = (query: string) => {
                clearTimeout(timer);
                loading.value = true;
                timer = setTimeout(() => {
                    results.value = servers
                        .filter((name) => name.includes(query.toLowerCase()))
                        .map((name) => ({ value: name, label: name, group: 'Server', icon: Server }));
                    loading.value = false;
                }, 600);
            };
            return { open, loading, results, search };
        },
        template: `
            <div class="flex flex-col items-center gap-3">
                <Button variant="outline" @click="open = true; search('')">Search servers</Button>
                <CommandPalette
                    v-model:open="open"
                    :items="results"
                    :filter="false"
                    :loading="loading"
                    :hotkey="false"
                    placeholder="Enter server name …"
                    empty-text="No server found"
                    @search="search"
                />
            </div>`,
    }),
};
