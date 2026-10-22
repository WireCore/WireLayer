import { House } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Breadcrumb from './Breadcrumb.vue';
import BreadcrumbItem from './BreadcrumbItem.vue';

const meta = {
    title: 'Navigation/Breadcrumb',
    component: Breadcrumb,
    args: { label: 'Path' },
    render: (args) => ({
        components: { Breadcrumb, BreadcrumbItem },
        setup: () => ({ args, House }),
        template: `
            <Breadcrumb v-bind="args">
                <BreadcrumbItem href="#" :icon="House" icon-only>Home</BreadcrumbItem>
                <BreadcrumbItem href="#">Services</BreadcrumbItem>
                <BreadcrumbItem current>Hosting</BreadcrumbItem>
            </Breadcrumb>`,
    }),
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** maxItems: the middle steps collapse into "…" – a menu with the hidden steps */
export const Collapsed: Story = {
    render: () => ({
        components: { Breadcrumb },
        setup: () => ({
            items: [
                { label: 'Home', href: '#', icon: House, iconOnly: true },
                { label: 'Services', href: '#' },
                { label: 'Hosting', href: '#' },
                { label: 'Managed Server', href: '#' },
                { label: 'Pricing', current: true },
            ],
            chosen: ref(''),
        }),
        template: `
            <div class="flex flex-col gap-3">
                <Breadcrumb :items="items" :max-items="3" @navigate="chosen = $event.label" />
                <span class="text-xs text-muted" aria-live="polite">{{ chosen && 'Selected: ' + chosen }}</span>
            </div>`,
    }),
};
