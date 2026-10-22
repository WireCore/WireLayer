import { ChartColumn, House, Mail, Server, Settings } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from '../Button/Button.vue';
import SidebarNav from '../SidebarNav/SidebarNav.vue';
import AppShell from './AppShell.vue';

const nav = [
    { label: 'Overview', href: '#', icon: House, current: true },
    { label: 'Server', href: '#', icon: Server },
    { label: 'Reports', href: '#', icon: ChartColumn },
    { label: 'Settings', href: '#', icon: Settings },
];

// With a counter and a group, for the rail
const railNav = [
    { label: 'Overview', href: '#', icon: House, current: true },
    { label: 'Messages', href: '#messages', icon: Mail, badge: 3 },
    { label: 'Server', href: '#server', icon: Server },
    {
        label: 'Reports',
        icon: ChartColumn,
        children: [
            { label: 'Utilization', href: '#utilization' },
            { label: 'Costs', href: '#costs' },
        ],
    },
    { label: 'Settings', href: '#settings', icon: Settings },
];

const content = `
    <h1 class="text-2xl font-semibold">Overview</h1>
    <p v-for="index in 12" :key="index" class="mt-3 max-w-prose text-sm text-muted">
        Paragraph {{ index }}: page content, long enough to scroll.
    </p>`;

const rail = (expandOnHover: boolean) => () => ({
    components: { AppShell, SidebarNav },
    setup: () => ({ collapsed: ref(true), railNav, expandOnHover }),
    template: `
        <AppShell collapsible v-model:navbar-collapsed="collapsed" :navbar-expand-on-hover="expandOnHover">
            <template #header><span class="font-semibold">WireLayer Admin</span></template>
            <template #navbar><SidebarNav :items="railNav" label="Main navigation" /></template>
            ${content}
        </AppShell>`,
});

const meta = {
    title: 'Layout/AppShell',
    component: AppShell,
    parameters: { layout: 'fullscreen' },
    render: () => ({
        components: { AppShell, Button, SidebarNav },
        setup: () => ({ nav }),
        template: `
            <AppShell>
                <template #header>
                    <span class="font-semibold">WireLayer Admin</span>
                    <Button size="sm" variant="outline" class="ml-auto">Sign out</Button>
                </template>
                <template #navbar><SidebarNav :items="nav" label="Main navigation" /></template>
                <h1 class="text-2xl font-semibold">Overview</h1>
                <p class="mt-2 text-sm text-muted">Page content. Below 1024 px, the button at the top left opens the navigation.</p>
                <template #aside><p class="text-sm text-muted">Notes on this page</p></template>
            </AppShell>`,
    }),
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };

/** The navbar folds into a rail of icons (desktop); the labels show as tooltips */
export const Rail: Story = { render: rail(false) };

/** The rail opens over the content while hovered or focused */
export const RailExpandOnHover: Story = { render: rail(true) };

/** Navbar and aside resizable (drag, arrow keys, Home/End, double click resets), remembered in localStorage */
export const Resizable: Story = {
    render: () => ({
        components: { AppShell, SidebarNav },
        setup: () => ({ nav }),
        template: `
            <AppShell navbar-resizable aside-resizable storage-key="wirecore-story-app-shell">
                <template #header><span class="font-semibold">WireLayer Admin</span></template>
                <template #navbar><SidebarNav :items="nav" label="Main navigation" /></template>
                ${content}
                <template #aside><p class="text-sm text-muted">Notes on this page</p></template>
            </AppShell>`,
    }),
};

/** The navbar runs the full height; the header hides while scrolling down (headroom); a footer */
export const NavbarFirstHeadroom: Story = {
    render: () => ({
        components: { AppShell, SidebarNav },
        setup: () => ({ nav }),
        template: `
            <AppShell layout="navbar-first" headroom>
                <template #header><span class="font-semibold">WireLayer Admin</span></template>
                <template #navbar><SidebarNav :items="nav" label="Main navigation" /></template>
                ${content}
                <template #footer><p>© 2026 WireLayer · Legal notice · Privacy</p></template>
            </AppShell>`,
    }),
};
