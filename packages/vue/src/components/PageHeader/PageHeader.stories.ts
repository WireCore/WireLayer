import { CalendarDays, MapPin, RotateCw, UserRound } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Breadcrumb from '../Breadcrumb/Breadcrumb.vue';
import Button from '../Button/Button.vue';
import Tabs from '../Tabs/Tabs.vue';
import TabsContent from '../Tabs/TabsContent.vue';
import TabsList from '../Tabs/TabsList.vue';
import TabsTrigger from '../Tabs/TabsTrigger.vue';
import PageHeader from './PageHeader.vue';

const meta = {
    title: 'Layout/PageHeader',
    component: PageHeader,
    args: {
        title: 'Server web-01',
        subtitle: 'Ubuntu 26.04 · 8 vCPU · 32 GB',
        status: 'Online',
        statusVariant: 'success',
        backHref: '#server',
    },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: {
            Breadcrumb,
            Button,
            PageHeader,
            Tabs,
            TabsContent,
            TabsList,
            TabsTrigger,
            CalendarDays,
            MapPin,
            UserRound,
        },
        setup: () => ({
            args,
            RotateCw,
            path: [{ label: 'Home', href: '#' }, { label: 'Server', href: '#server' }, { label: 'web-01' }],
        }),
        template: `
            <PageHeader v-bind="args">
                <template #breadcrumb><Breadcrumb :items="path" /></template>
                <template #meta>
                    <span class="inline-flex items-center gap-1"><MapPin class="size-3.5" aria-hidden="true" /> Frankfurt</span>
                    <span class="inline-flex items-center gap-1"><CalendarDays class="size-3.5" aria-hidden="true" /> Created on Mar 12, 2026</span>
                    <span class="inline-flex items-center gap-1"><UserRound class="size-3.5" aria-hidden="true" /> Julia Berg</span>
                </template>
                <template #actions>
                    <Button variant="outline" size="sm">Console</Button>
                    <Button size="sm" :leading-icon="RotateCw">Restart</Button>
                </template>
                <template #tabs>
                    <Tabs default-value="overview" label="Server">
                        <TabsList>
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="metrics">Utilization</TabsTrigger>
                            <TabsTrigger value="backups">Backups</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview" class="text-sm text-muted">Overview of web-01</TabsContent>
                        <TabsContent value="metrics" class="text-sm text-muted">Utilization over the last 24 hours</TabsContent>
                        <TabsContent value="backups" class="text-sm text-muted">Backups from the last 30 days</TabsContent>
                    </Tabs>
                </template>
            </PageHeader>`,
    }),
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Breadcrumb, back link, title with status, meta, actions (they wrap below on narrow screens) and tabs */
export const Playground: Story = {};

/** Only a title and actions, with a line below */
export const Simple: Story = {
    render: () => ({
        components: { Button, PageHeader },
        template: `
            <PageHeader title="Invoices" subtitle="All invoices from the last 24 months" divided>
                <template #actions><Button size="sm">Create invoice</Button></template>
            </PageHeader>`,
    }),
};

/** Smaller title, e.g. in a panel (heading level 2) */
export const Small: Story = {
    render: () => ({
        components: { PageHeader },
        template: `<PageHeader title="Settings" :heading-level="2" size="sm" back-href="#account" back-label="Back to account" />`,
    }),
};
