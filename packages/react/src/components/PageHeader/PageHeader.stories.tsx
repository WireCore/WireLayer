import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalendarDays, MapPin, RotateCw, UserRound } from 'lucide-react';
import { Breadcrumb } from '../Breadcrumb/Breadcrumb.js';
import { Button } from '../Button/Button.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Tabs/Tabs.js';
import { PageHeader } from './PageHeader.js';

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
    render: (args) => (
        <PageHeader
            {...args}
            breadcrumb={
                <Breadcrumb
                    items={[{ label: 'Home', href: '#' }, { label: 'Server', href: '#server' }, { label: 'web-01' }]}
                />
            }
            meta={
                <>
                    <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" aria-hidden="true" /> Frankfurt
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3.5" aria-hidden="true" /> Created on Mar 12, 2026
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <UserRound className="size-3.5" aria-hidden="true" /> Julia Berg
                    </span>
                </>
            }
            actions={
                <>
                    <Button variant="outline" size="sm">
                        Console
                    </Button>
                    <Button size="sm" leadingIcon={RotateCw}>
                        Restart
                    </Button>
                </>
            }
            tabs={
                <Tabs defaultValue="overview" label="Server">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="metrics">Utilization</TabsTrigger>
                        <TabsTrigger value="backups">Backups</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="text-sm text-muted">
                        Overview of web-01
                    </TabsContent>
                    <TabsContent value="metrics" className="text-sm text-muted">
                        Utilization over the last 24 hours
                    </TabsContent>
                    <TabsContent value="backups" className="text-sm text-muted">
                        Backups from the last 30 days
                    </TabsContent>
                </Tabs>
            }
        />
    ),
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Breadcrumb, back link, title with status, meta, actions (they wrap below on narrow screens) and tabs */
export const Playground: Story = {};

/** Only a title and actions, with a line below */
export const Simple: Story = {
    render: () => (
        <PageHeader
            title="Invoices"
            subtitle="All invoices from the last 24 months"
            divided
            actions={<Button size="sm">Create invoice</Button>}
        />
    ),
};

/** Smaller title, e.g. in a panel (heading level 2) */
export const Small: Story = {
    render: () => (
        <PageHeader title="Settings" headingLevel={2} size="sm" backHref="#account" backLabel="Back to account" />
    ),
};
