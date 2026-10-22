import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowRight, CodeXml } from 'lucide-react';
import { Badge } from '../Badge/Badge.js';
import { Button } from '../Button/Button.js';
import { Card } from './Card.js';

// Picture as inline SVG, so Storybook and the tests need no network
const picture = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#0d9488"/><stop offset="1" stop-color="#1e66f5"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/></svg>'
)}`;

const meta = {
    title: 'Data/Card',
    component: Card,
    args: { interactive: false },
    render: (args) => (
        <Card {...args} className="w-80">
            <span className="label-mono">Card</span>
            <p className="text-sm text-muted">Container with a border, 20px radius and 24px padding.</p>
        </Card>
    ),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ServiceCard: Story = {
    render: () => (
        <Card interactive asChild className="w-80">
            <a href="#">
                <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-[10px] border border-line-2">
                        <CodeXml className="size-5" aria-hidden="true" />
                    </span>
                    <Badge variant="outline">01</Badge>
                </div>
                <h3 className="mt-2 text-[21px] font-semibold tracking-[-0.025em]">Software &amp; Web</h3>
                <p className="text-sm leading-[1.55] text-pretty text-muted">
                    Web applications, websites, internal tools, APIs and automation.
                </p>
                <span className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold">
                    Learn more
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                </span>
            </a>
        </Card>
    ),
};

/** Title, subtitle, media, an extra in the header and actions in the footer; the default content stays in between */
export const WithTitle: Story = {
    render: () => (
        <Card
            className="w-80"
            title="Managed Hosting"
            subtitle="Data centers in Frankfurt"
            media={<img src={picture} alt="" className="aspect-video w-full object-cover" />}
            header={<Badge variant="success">New</Badge>}
            footer={
                <>
                    <Button size="sm">Inquire</Button>
                    <Button size="sm" variant="text">
                        Details
                    </Button>
                </>
            }
        >
            <p className="text-sm text-muted">Operations, monitoring and backups around the clock.</p>
        </Card>
    ),
};

/** Media at the start, content beside it; the title level fits the page outline (here h2) */
export const Horizontal: Story = {
    render: () => (
        <Card
            className="max-w-xl"
            orientation="horizontal"
            title="Maintenance contract"
            titleTag="h2"
            subtitle="24-month term"
            media={<img src={picture} alt="" className="h-full w-full object-cover" />}
            footer={
                <Button size="sm" variant="outline">
                    View contract
                </Button>
            }
        >
            <p className="text-sm text-muted">Updates, security patches and a dedicated contact person.</p>
        </Card>
    ),
};
