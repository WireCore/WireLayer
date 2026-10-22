import { ChartColumn, House, LogOut, Server, Settings, Users } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import SidebarNav, { type SidebarNavProps } from './SidebarNav.vue';
import type { SidebarNavItem } from './types.js';

const items: SidebarNavItem[] = [
    { label: 'Overview', href: '#overview', icon: House },
    {
        label: 'Infrastructure',
        icon: Server,
        children: [
            { label: 'Server', href: '#server', current: true },
            { label: 'Networks', href: '#networks' },
            { label: 'Backups', href: '#backups' },
        ],
    },
    {
        label: 'Reports',
        icon: ChartColumn,
        children: [
            { label: 'Load', href: '#load' },
            { label: 'Costs', href: '#costs' },
        ],
    },
    { label: 'Team', href: '#team', icon: Users, badge: 2 },
    { label: 'Settings', href: '#settings', icon: Settings },
];

// The demo marks the clicked link as the current page; `wrapper` sizes the story, `withSlots` adds header and footer
const demo =
    (wrapper = '', withSlots = false) =>
    (args: SidebarNavProps) => ({
        components: { LogOut, SidebarNav },
        setup: () => {
            const nav = ref<SidebarNavItem[]>(items);
            const navigate = (item: SidebarNavItem, event: MouseEvent) => {
                event.preventDefault();
                const mark = (list: SidebarNavItem[]): SidebarNavItem[] =>
                    list.map((entry) => ({
                        ...entry,
                        current: entry === item,
                        children: entry.children && mark(entry.children),
                    }));
                nav.value = mark(nav.value);
            };
            return { args, nav, navigate, wrapper, withSlots };
        },
        template: `
            <div :class="wrapper || undefined">
                <SidebarNav v-bind="args" :items="nav" :class="args.rail ? undefined : 'w-60'" @navigate="navigate">
                    <template v-if="withSlots" #header><span class="px-2.5 font-semibold">WireLayer</span></template>
                    <template v-if="withSlots" #footer>
                        <a href="#sign-out" class="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm hover:bg-line">
                            <LogOut class="size-4 text-muted" aria-hidden="true" /> Sign out
                        </a>
                    </template>
                </SidebarNav>
            </div>`,
    });

const meta: Meta<typeof SidebarNav> = {
    title: 'Navigation/SidebarNav',
    component: SidebarNav,
    args: { items, label: 'Main navigation' },
    argTypes: { items: { control: false } },
    render: demo(),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** With a header, a footer and counters */
export const HeaderAndFooter: Story = { render: demo('flex h-[28rem]', true) };

/** Icons only; the labels show as tooltips and stay the names of the links */
export const Rail: Story = { args: { rail: true }, render: demo('w-16') };

/** The rail shows the labels while hovered or focused */
export const RailExpandOnHover: Story = {
    args: { rail: true, expandOnHover: true },
    render: demo('w-16 hover:w-60 focus-within:w-60'),
};
